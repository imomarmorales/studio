'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { useCollection, useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc, runTransaction } from 'firebase/firestore';
import type { CongressEvent } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { EventDetailsDialog } from '@/components/events/EventDetailsDialog';
import { QrScannerDialog } from '@/components/events/QrScannerDialog';
import { useToast } from '@/hooks/use-toast';
import { EventCard } from '@/components/events/EventCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getEventStatus, canMarkAttendance, decodeEventQR } from '@/lib/event-utils';

function EventCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-video w-full" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

export default function AgendaPage() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const [selectedEvent, setSelectedEvent] = useState<CongressEvent | null>(null);
  const [isScannerOpen, setScannerOpen] = useState(false);
  const [eventForAttendance, setEventForAttendance] = useState<CongressEvent | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'in-progress' | 'upcoming'>('all');

  const eventsQuery = useMemoFirebase(
    () => {
      if (!firestore) return null;
      if (isUserLoading) return null; // Wait for auth to complete
      if (!user) return null; // No user, no query
      return query(collection(firestore, 'events'), orderBy('dateTime', 'asc'));
    },
    [firestore, user, isUserLoading]
  );
  const { data: events, isLoading, error} = useCollection<CongressEvent>(eventsQuery);

  const handleMarkAttendanceClick = (event: CongressEvent) => {
    if (!canMarkAttendance(event)) {
      toast({
        variant: 'destructive',
        title: 'Fuera de horario',
        description: 'Solo puedes marcar asistencia durante el evento.',
      });
      return;
    }
    setEventForAttendance(event);
    setSelectedEvent(null);
    setScannerOpen(true);
  };

  const handleScanSuccess = async (scannedData: string) => {
    setScannerOpen(false);
    
    if (!firestore || !user || !eventForAttendance) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo procesar la asistencia.' });
        return;
    }

    // Decodificar QR
    const decoded = decodeEventQR(scannedData);
    if (!decoded) {
        toast({ variant: 'destructive', title: 'QR Inválido', description: 'El código QR no tiene el formato correcto.' });
        return;
    }

    // Validar que corresponde al evento
    if (decoded.eventId !== eventForAttendance.id) {
        toast({ variant: 'destructive', title: 'QR Incorrecto', description: 'Este código QR no corresponde al evento seleccionado.' });
        return;
    }

    // Validar token y estado
    if (decoded.qrToken !== eventForAttendance.qrToken) {
        toast({ variant: 'destructive', title: 'QR Inválido', description: 'El token del QR no coincide.' });
        return;
    }

    if (!eventForAttendance.qrValid) {
        toast({ variant: 'destructive', title: 'QR Invalidado', description: 'Este QR ha sido invalidado por el administrador.' });
        return;
    }

    // Validar horario
    if (!canMarkAttendance(eventForAttendance)) {
        toast({ variant: 'destructive', title: 'Fuera de horario', description: 'Este evento no está en horario de registro de asistencia.' });
        return;
    }
    
    const attendanceRef = collection(firestore, `users/${user.uid}/attendance`);
    const attendeeRef = doc(firestore, `events/${eventForAttendance.id}/attendees`, user.uid);
    const userRef = doc(firestore, 'users', user.uid);

    try {
        await runTransaction(firestore, async (transaction) => {
            // 1. Check if attendance already exists
            const attendanceDocId = `${user.uid}_${eventForAttendance.id}`;
            const attendanceDocRef = doc(attendanceRef, attendanceDocId);
            const existingAttendance = await transaction.get(attendanceDocRef);
            
            if (existingAttendance.exists()) {
                throw new Error("Ya has registrado tu asistencia para este evento.");
            }

            // 2. Create attendance record
            const newAttendance = {
                id: attendanceDocId,
                participantId: user.uid,
                eventId: eventForAttendance.id,
                timestamp: serverTimestamp(),
                pointsEarned: eventForAttendance.pointsPerAttendance || 100,
            };
            transaction.set(attendanceDocRef, newAttendance);

            // 3. Create mirror in event attendees
            transaction.set(attendeeRef, {
                participantId: user.uid,
                timestamp: serverTimestamp(),
            });

            // 4. Increment user points
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) {
                throw new Error("User document not found!");
            }
            const currentPoints = userDoc.data().points || 0;
            const pointsToAdd = eventForAttendance.pointsPerAttendance || 100;
            transaction.update(userRef, { points: currentPoints + pointsToAdd });
        });

        // Success feedback
        const pointsEarned = eventForAttendance.pointsPerAttendance || 100;
        toast({
            title: '¡Asistencia Registrada! 🎉',
            description: `Has ganado ${pointsEarned} puntos por asistir a ${eventForAttendance.title}.`,
        });

        // TODO: Play success sound
        // TODO: Haptic feedback if available

    } catch (e: any) {
        console.error("Transaction failed: ", e);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: e.message || 'No se pudo registrar la asistencia.',
        });
    }
  };

  // Filtrar eventos por tab
  const filteredEvents = events?.filter((event) => {
    if (filterTab === 'all') return true;
    const status = getEventStatus(event);
    if (filterTab === 'in-progress') return status === 'in-progress';
    if (filterTab === 'upcoming') return status === 'upcoming';
    return true;
  }) || [];

  const inProgressCount = events?.filter(e => getEventStatus(e) === 'in-progress').length || 0;
  const upcomingCount = events?.filter(e => getEventStatus(e) === 'upcoming').length || 0;

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

      <Tabs value={filterTab} onValueChange={(v) => setFilterTab(v as typeof filterTab)}>
        <TabsList className="grid w-full grid-cols-3 lg:w-96">
          <TabsTrigger value="all">
            Todos ({events?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="in-progress">
            En Curso {inProgressCount > 0 && <span className="ml-1 animate-pulse">🔴</span>}
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            Próximos ({upcomingCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filterTab} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading && Array.from({ length: 6 }).map((_, i) => <EventCardSkeleton key={i} />)}
            
            {!isLoading && filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onViewDetails={setSelectedEvent}
                onMarkAttendance={handleMarkAttendanceClick}
              />
            ))}
          </div>

          {!isLoading && filteredEvents.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground">
                {filterTab === 'all' && 'No hay eventos programados por el momento.'}
                {filterTab === 'in-progress' && 'No hay eventos en curso en este momento.'}
                {filterTab === 'upcoming' && 'No hay eventos próximos.'}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

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
