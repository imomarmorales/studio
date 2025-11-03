'use server';

import { Firestore, doc, getDoc, runTransaction, collection, query, where, getDocs, serverTimestamp, writeBatch } from "firebase/firestore";
import type { Participant } from "./types";

/**
 * Marks attendance for a user to a specific event, ensuring no duplicates,
 * and increments the user's points. This function is designed to be called
 * from a client-side action (e.g., after scanning a QR code).
 *
 * @param {Firestore} db - The Firestore instance.
 * @param {string} userId - The UID of the user marking attendance.
 * @param {string} eventId - The ID of the event to mark attendance for.
 * @throws {Error} Throws an error if the event doesn't exist, if attendance is already marked, or on transaction failure.
 */
export async function markAttendance(db: Firestore, userId: string, eventId: string): Promise<void> {
    
    const userRef = doc(db, "users", userId);
    const eventRef = doc(db, "congressEvents", eventId);
    const attendanceCollectionRef = collection(db, `users/${userId}/attendance`);
    
    // Check if the event exists first to provide a better error message.
    const eventSnap = await getDoc(eventRef);
    if (!eventSnap.exists()) {
        throw new Error("El evento no existe o el código QR es inválido.");
    }
    
    // Check if attendance has already been marked for this event.
    const attendanceQuery = query(attendanceCollectionRef, where("congressEventId", "==", eventId));
    const attendanceSnap = await getDocs(attendanceQuery);
    if (!attendanceSnap.empty) {
        throw new Error("Ya has registrado tu asistencia para este evento.");
    }

    try {
        await runTransaction(db, async (transaction) => {
            // 1. Get the current user's data.
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) {
                throw new Error("User document not found.");
            }
            const userData = userDoc.data() as Participant;

            // 2. Increment points.
            const newPoints = (userData.points || 0) + 1;
            transaction.update(userRef, { points: newPoints });

            // 3. Create a new attendance record.
            const newAttendanceRef = doc(attendanceCollectionRef); // Create a new doc with a random ID
            transaction.set(newAttendanceRef, {
                participantId: userId,
                congressEventId: eventId,
                timestamp: serverTimestamp(),
            });
        });
    } catch (error) {
        console.error("Transaction failed: ", error);
        throw new Error("No se pudo registrar la asistencia. Inténtalo de nuevo.");
    }
}
