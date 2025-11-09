'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { useCollection, useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc, runTransaction } from 'firebase/firestore';
import type { CongressEvent } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Calendar, MapPin } from 'lucide-react';
import Image from 'next/image';
import { EventDetailsDialog } from '@/components/events/EventDetailsDialog';
import { QrScannerDialog } from '@/components/events/QrScannerDialog';
import { useToast } from '@/hooks/use-toast';

function EventCardSkeleton() {
  return (
    <Card>
      <CardHeader className="p-0">
        <Skeleton className="h-40 w-full" />
      </CardHeader>
      <CardContent className="pt-6">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  );
}

export default function AgendaPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { toast } = useToast();

  const [selectedEvent, setSelectedEvent] = useState<CongressEvent | null>(null);
  const [isScannerOpen, setScannerOpen] = useState(false);
  const [eventForAttendance, setEventForAttendance] = useState<CongressEvent | null>(null);

  const eventsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'events'), orderBy('dateTime', 'asc')) : null),
    [firestore]
  );
  const { data: events, isLoading, error } = useCollection<CongressEvent>(eventsQuery);

  const handleMarkAttendanceClick = (event: CongressEvent) => {
    setEventForAttendance(event);
    setSelectedEvent(null); // Close details dialog
    setScannerOpen(true);
  };

  const handleScanSuccess = async (scannedData: string) => {
    setScannerOpen(false);
    if (!firestore || !user || !eventForAttendance) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo procesar la asistencia.' });
        return;
    }

    if (scannedData !== eventForAttendance.id) {
        toast({ variant: 'destructive', title: 'QR Incorrecto', description: 'Este código QR no corresponde al evento seleccionado.' });
        return;
    }
    
    const attendanceRef = collection(firestore, `users/${user.uid}/attendance`);
    const userRef = doc(firestore, 'users', user.uid);

    try {
        // Use a transaction to ensure atomicity
        await runTransaction(firestore, async (transaction) => {
            // 1. Add attendance record
            const newAttendance = {
                participantId: user.uid,
                eventId: eventForAttendance.id,
                timestamp: serverTimestamp(),
            };
            // To prevent duplicate attendance, we can create a specific doc ID
            const attendanceDocRef = doc(attendanceRef, `${user.uid}_${eventForAttendance.id}`);
            
            // Check if attendance already exists
            const existingAttendanceDoc = await transaction.get(attendanceDocRef);
            if (existingAttendanceDoc.exists()) {
                throw new Error("Ya has registrado tu asistencia para este evento.");
            }

            transaction.set(attendanceDocRef, newAttendance);

            // 2. Increment user points
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) {
                throw new Error("User document not found!");
            }
            const currentPoints = userDoc.data().points || 0;
            transaction.update(userRef, { points: currentPoints + 10 });
        });

        toast({
            title: '¡Asistencia Registrada!',
            description: `Has ganado 10 puntos por asistir a ${eventForAttendance.title}.`,
        });

    } catch (e: any) {
        console.error("Transaction failed: ", e);
        toast({
            variant: 'destructive',
            title: 'Error al registrar asistencia',
            description: e.message || 'Hubo un problema al registrar tu asistencia.',
        });
    }

    setEventForAttendance(null);
  };


  return (
    <div className="space-y-8">
      <PageHeader
        title="Agenda y Eventos"
        description="Explora las conferencias, talleres y actividades disponibles."
      />

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error al Cargar Eventos</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && Array.from({ length: 6 }).map((_, i) => <EventCardSkeleton key={i} />)}
        
        {events && events.map((event) => (
          <Card key={event.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedEvent(event)}>
            <CardHeader className="p-0">
               <div className="relative w-full h-48">
                    <Image
                    src={event.imageUrl || `https://picsum.photos/seed/${event.id}/600/400`}
                    alt={`Imagen de ${event.title}`}
                    fill
                    className="object-cover rounded-t-lg"
                    />
               </div>
            </CardHeader>
            <CardContent className="pt-6">
              <CardTitle className="text-lg font-bold mb-2">{event.title}</CardTitle>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>{new Date(event.dateTime).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
                <div className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4" />
                    <span>{event.location}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

       {!isLoading && events?.length === 0 && (
          <div className="text-center py-16 col-span-full">
            <p className="text-muted-foreground">No hay eventos programados por el momento.</p>
          </div>
        )}

        <EventDetailsDialog 
            event={selectedEvent} 
            isOpen={!!selectedEvent} 
            onOpenChange={() => setSelectedEvent(null)}
            onMarkAttendanceClick={() => selectedEvent && handleMarkAttendanceClick(selectedEvent)}
        />

        <QrScannerDialog 
            isOpen={isScannerOpen}
            onOpenChange={setScannerOpen}
            onScanSuccess={handleScanSuccess}
        />
    </div>
  );
}