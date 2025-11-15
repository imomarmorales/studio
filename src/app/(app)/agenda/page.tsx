'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollection, useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc, runTransaction } from 'firebase/firestore';
import type { CongressEvent } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Bell, X, Calendar as CalendarIcon, Grid3x3, List } from 'lucide-react';
import { EventDetailsDialog } from '@/components/events/EventDetailsDialog';
import { QrScannerDialog } from '@/components/events/QrScannerDialog';
import { useToast } from '@/hooks/use-toast';
import { EventCard } from '@/components/events/EventCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getEventStatus, canMarkAttendance, decodeEventQR } from '@/lib/event-utils';
import { Button } from '@/components/ui/button';
import { EventTimeline } from '@/components/events/EventTimeline';
import { checkAndAwardBadges } from '@/lib/badges';
import { format, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

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
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'grid' | 'timeline'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

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

  // Update current time every minute to refresh event statuses
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Check for newly started events and show notification
  useEffect(() => {
    if (!events || events.length === 0) return;

    const inProgressEvents = events.filter(e => getEventStatus(e) === 'in-progress');
    
    if (inProgressEvents.length > 0 && !dismissedBanner) {
      // Play subtle notification sound
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 600;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
      } catch (e) {
        // Silent fail if audio context not available
      }
    }
  }, [events, dismissedBanner]);

  // Check for events starting soon (15 minutes before)
  useEffect(() => {
    if (!events || events.length === 0) return;

    const checkUpcomingEvents = () => {
      const now = new Date();

      events.forEach((event) => {
        const eventStart = new Date(event.dateTime);
        const timeDiff = eventStart.getTime() - now.getTime();
        const minutesUntilStart = Math.floor(timeDiff / 60000);

        // Notify 15 minutes before (with 1-minute tolerance window)
        if (minutesUntilStart === 15 && !sessionStorage.getItem(`notified-${event.id}-15`)) {
          toast({
            title: '⏰ Evento por comenzar',
            description: `"${event.title}" comienza en 15 minutos.`,
            duration: 8000,
          });
          sessionStorage.setItem(`notified-${event.id}-15`, 'true');
        }

        // Notify when event starts (with 1-minute tolerance)
        if (minutesUntilStart === 0 && !sessionStorage.getItem(`notified-${event.id}-start`)) {
          toast({
            title: '🔴 ¡Evento Iniciando!',
            description: `"${event.title}" está comenzando ahora.`,
            duration: 10000,
          });
          sessionStorage.setItem(`notified-${event.id}-start`, 'true');
          setDismissedBanner(false); // Show banner again
        }
      });
    };

    checkUpcomingEvents();
    const interval = setInterval(checkUpcomingEvents, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [events, toast]);

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
        let newAttendanceCount = 0;
        
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

            // 4. Increment user points and attendance count
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) {
                throw new Error("User document not found!");
            }
            const currentPoints = userDoc.data().points || 0;
            const currentAttendanceCount = userDoc.data().attendanceCount || 0;
            const pointsToAdd = eventForAttendance.pointsPerAttendance || 100;
            
            newAttendanceCount = currentAttendanceCount + 1;
            
            transaction.update(userRef, { 
                points: currentPoints + pointsToAdd,
                attendanceCount: newAttendanceCount,
            });
        });

        // Check for new badges after successful attendance
        const newBadges = await checkAndAwardBadges(firestore, user.uid, newAttendanceCount);

        // Success feedback
        const pointsEarned = eventForAttendance.pointsPerAttendance || 100;
        
        if (newBadges.length > 0) {
            // Show badge notification
            toast({
                title: '🏆 ¡Nueva Insignia Desbloqueada!',
                description: `Has desbloqueado "${newBadges[0].name}". ¡Felicitaciones!`,
                duration: 8000,
            });
            
            // Play celebratory sound
            try {
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                // Happy ascending notes
                oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C
                oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.15); // E
                oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.3); // G
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.6);
            } catch (e) {
                console.error('Audio error:', e);
            }
            
            // After a delay, show points notification
            setTimeout(() => {
                toast({
                    title: '✅ Asistencia Registrada',
                    description: `+${pointsEarned} puntos por asistir a ${eventForAttendance.title}.`,
                });
            }, 1500);
        } else {
            // Regular success notification
            toast({
                title: '¡Asistencia Registrada! 🎉',
                description: `Has ganado ${pointsEarned} puntos por asistir a ${eventForAttendance.title}.`,
            });
        }

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
  const inProgressEvents = events?.filter(e => getEventStatus(e) === 'in-progress') || [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Agenda y Eventos"
        description="Explora las conferencias, talleres y actividades disponibles."
      />

      {/* Banner for events in progress */}
      {inProgressEvents.length > 0 && !dismissedBanner && (
        <Alert className="border-red-500 bg-red-50 dark:bg-red-950/20 animate-in slide-in-from-top-5 duration-500">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Bell className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 animate-pulse" />
              <div className="flex-1">
                <AlertTitle className="text-red-900 dark:text-red-100 font-bold">
                  🔴 {inProgressEvents.length} {inProgressEvents.length === 1 ? 'Evento en Curso' : 'Eventos en Curso'}
                </AlertTitle>
                <AlertDescription className="text-red-800 dark:text-red-200 mt-1">
                  {inProgressEvents.length === 1 ? (
                    <>
                      <strong>{inProgressEvents[0].title}</strong> está en curso ahora. ¡No te lo pierdas!
                    </>
                  ) : (
                    <>
                      Hay <strong>{inProgressEvents.length} eventos</strong> ocurriendo en este momento.
                    </>
                  )}
                </AlertDescription>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 border-red-600 text-red-700 hover:bg-red-100 dark:border-red-400 dark:text-red-300 dark:hover:bg-red-900/30"
                  onClick={() => setFilterTab('in-progress')}
                >
                  Ver Eventos en Curso →
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400"
              onClick={() => setDismissedBanner(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error al Cargar Eventos</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)} className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <TabsList className="grid w-full sm:w-auto grid-cols-3">
            <TabsTrigger value="calendar" className="gap-2">
              <CalendarIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Calendario</span>
              <span className="sm:hidden">Cal</span>
            </TabsTrigger>
            <TabsTrigger value="grid" className="gap-2">
              <Grid3x3 className="w-4 h-4" />
              <span className="hidden sm:inline">Tarjetas</span>
              <span className="sm:hidden">Grid</span>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2">
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Cronograma</span>
              <span className="sm:hidden">Lista</span>
            </TabsTrigger>
          </TabsList>

          {/* Filter Tabs */}
          <Tabs value={filterTab} onValueChange={(v) => setFilterTab(v as typeof filterTab)}>
            <TabsList className="grid w-full sm:w-auto grid-cols-3">
              <TabsTrigger value="all">
                Todos ({events?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="in-progress" className={inProgressCount > 0 ? 'data-[state=active]:bg-red-100 dark:data-[state=active]:bg-red-900/30' : ''}>
                <span className="flex items-center gap-1.5">
                  <span className="hidden sm:inline">En Curso</span>
                  <span className="sm:hidden">Curso</span>
                  {inProgressCount > 0 && (
                    <>
                      <span className="font-bold">({inProgressCount})</span>
                      <span className="animate-pulse text-red-600 dark:text-red-400">🔴</span>
                    </>
                  )}
                  {inProgressCount === 0 && '(0)'}
                </span>
              </TabsTrigger>
              <TabsTrigger value="upcoming">
                <span className="hidden sm:inline">Próximos ({upcomingCount})</span>
                <span className="sm:hidden">Próx. ({upcomingCount})</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Calendar View */}
        <TabsContent value="calendar" className="space-y-6 mt-0">
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
              {/* Week Days */}
              {(() => {
                const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
                const weekDays = eachDayOfInterval({
                  start: weekStart,
                  end: endOfWeek(selectedDate, { weekStartsOn: 1 })
                });

                return weekDays.map((day) => {
                  const dayEvents = (filteredEvents || []).filter(event =>
                    isSameDay(new Date(event.dateTime), day)
                  ).sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

                  const isToday = isSameDay(day, new Date());
                  const isSelected = isSameDay(day, selectedDate);

                  return (
                    <Card
                      key={day.toISOString()}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        isToday ? 'border-primary border-2' : ''
                      } ${isSelected ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => setSelectedDate(day)}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-center">
                          <div className={`${isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                            {format(day, 'EEE', { locale: es })}
                          </div>
                          <div className={`text-2xl mt-1 ${isToday ? 'bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center mx-auto' : ''}`}>
                            {format(day, 'd')}
                          </div>
                          {isToday && (
                            <div className="text-xs text-primary mt-1">Hoy</div>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {dayEvents.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-4">
                            Sin eventos
                          </p>
                        ) : (
                          dayEvents.map((event) => {
                            const status = getEventStatus(event);
                            return (
                              <div
                                key={event.id}
                                className={`p-2 rounded-md text-xs border cursor-pointer hover:shadow-md transition-all ${
                                  status === 'in-progress'
                                    ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                                    : status === 'upcoming'
                                    ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                                    : 'bg-muted/50 border-border'
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEvent(event);
                                }}
                              >
                                <div className="font-semibold line-clamp-2 mb-1">{event.title}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  {status === 'in-progress' && <span className="animate-pulse">🔴</span>}
                                  {format(new Date(event.dateTime), 'HH:mm', { locale: es })}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </CardContent>
                    </Card>
                  );
                });
              })()}
            </div>
          )}
          
          {/* Navigation Buttons */}
          <div className="flex justify-center gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setSelectedDate(subDays(selectedDate, 7))}
            >
              ← Semana Anterior
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedDate(new Date())}
            >
              Hoy
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedDate(addDays(selectedDate, 7))}
            >
              Siguiente Semana →
            </Button>
          </div>
        </TabsContent>

        {/* Grid View */}
        <TabsContent value="grid" className="space-y-6 mt-0">
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

        {/* Timeline View */}
        <TabsContent value="timeline" className="space-y-6 mt-0">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <EventTimeline events={filteredEvents} />
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
