import { getApps, getApp, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseConfig } from './config';

// IMPORTANT: DO NOT LEAK THE SERVICE ACCOUNT KEY TO THE CLIENT
// This is a server-only file.
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

/**
 * Initializes the Firebase Admin SDK on the server-side if it hasn't been already.
 * This is safe to call multiple times.
 * @returns An object containing the server-side Firestore instance.
 */
export async function initializeServerApp() {
  if (getApps().length === 0) {
    if (serviceAccount) {
      // Use service account when available (recommended for production)
      initializeApp({
        credential: cert(serviceAccount),
        projectId: firebaseConfig.projectId,
      });
    } else {
      // Fallback for local development if service account is not set
      console.warn(
        'Firebase service account not found. Initializing with default credentials for local development. For production, set the FIREBASE_SERVICE_ACCOUNT environment variable.'
      );
      initializeApp({
        projectId: firebaseConfig.projectId,
      });
    }
  }

  return {
    firestore: getFirestore(getApp()),
  };
}
