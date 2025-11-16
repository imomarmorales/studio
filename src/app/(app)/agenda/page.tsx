'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollection, useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc, runTransaction, getDoc } from 'firebase/firestore';
import type { CongressEvent } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Bell, X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, ListOrdered } from 'lucide-react';
import { EventDetailsDialog } from '@/components/events/EventDetailsDialog';
import { QrScannerDialog } from '@/components/events/QrScannerDialog';
import { useToast } from '@/hooks/use-toast';
import { EventCard } from '@/components/events/EventCard';
import { getEventStatus, canMarkAttendance, decodeEventQR } from '@/lib/event-utils';
import { Button } from '@/components/ui/button';
import { checkAndAwardBadges } from '@/lib/badges';
import { format, isSameDay, addDays, subDays, startOfDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'grid' | 'itinerary'>('grid');
  const [eventFilter, setEventFilter] = useState<'available' | 'expired'>('available');

  const eventsQuery = useMemoFirebase(
    () => {
      if (!firestore) return null;
      return query(collection(firestore, 'events'), orderBy('dateTime', 'asc'));
    },
    [firestore]
  );
  const { data: events, isLoading, error} = useCollection<CongressEvent>(eventsQuery);

  // Get user's attendance records
  const attendanceQuery = useMemoFirebase(
    () => {
      if (!firestore || !user) return null;
      return collection(firestore, `users/${user.uid}/attendance`);
    },
    [firestore, user]
  );
  const { data: attendanceRecords } = useCollection<{ eventId: string }>(attendanceQuery);

  // Create a set of event IDs user has attended
  const attendedEventIds = new Set(attendanceRecords?.map(record => record.eventId) || []);

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
        // Verificar primero si ya existe asistencia (antes de la transacción)
        const attendanceDocId = `${user.uid}_${eventForAttendance.id}`;
        const attendanceDocRef = doc(attendanceRef, attendanceDocId);
        const existingAttendanceCheck = await getDoc(attendanceDocRef);
        
        if (existingAttendanceCheck.exists()) {
            // Mostrar mensaje amigable sin error
            toast({
                title: 'Asistencia Ya Registrada ✓',
                description: 'Tu asistencia para este evento ya fue registrada anteriormente.',
                duration: 5000,
            });
            return; // Salir sin error
        }

        let newAttendanceCount = 0;
        
        await runTransaction(firestore, async (transaction) => {
            // ⚠️ TODAS LAS LECTURAS PRIMERO
            // 1. Read user document
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) {
                throw new Error("User document not found!");
            }
            
            // Calcular valores
            const currentPoints = userDoc.data().points || 0;
            const currentAttendanceCount = userDoc.data().attendanceCount || 0;
            const pointsToAdd = eventForAttendance.pointsPerAttendance || 100;
            newAttendanceCount = currentAttendanceCount + 1;
            
            // ✅ AHORA SÍ, TODAS LAS ESCRITURAS
            // 3. Create attendance record
            const newAttendance = {
                id: attendanceDocId,
                participantId: user.uid,
                eventId: eventForAttendance.id,
                timestamp: serverTimestamp(),
                pointsEarned: pointsToAdd,
            };
            transaction.set(attendanceDocRef, newAttendance);

            // 4. Create mirror in event attendees
            transaction.set(attendeeRef, {
                participantId: user.uid,
                timestamp: serverTimestamp(),
            });

            // 5. Update user points and attendance count
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
        
        // Manejar error de asistencia duplicada de forma especial
        if (e.message === "Ya has registrado tu asistencia para este evento.") {
            toast({
                title: 'Ya Registrado ✓',
                description: 'Tu asistencia ya fue registrada anteriormente para este evento.',
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: e.message || 'No se pudo registrar la asistencia.',
            });
        }
    }
  };

  // Filtrar eventos del día seleccionado (para itinerario)
  const eventsForSelectedDay = events?.filter((event) => 
    isSameDay(new Date(event.dateTime), selectedDate)
  ) || [];

  // Agrupar eventos por hora (para itinerario)
  const eventsByHour = eventsForSelectedDay.reduce((acc, event) => {
    const hour = format(parseISO(event.dateTime), 'HH:00');
    if (!acc[hour]) {
      acc[hour] = [];
    }
    acc[hour].push(event);
    return acc;
  }, {} as Record<string, CongressEvent[]>);

  // Ordenar las horas
  const sortedHours = Object.keys(eventsByHour).sort();

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
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="grid" className="gap-2">
            <CalendarIcon className="w-4 h-4" />
            Eventos
          </TabsTrigger>
          <TabsTrigger value="itinerary" className="gap-2">
            <ListOrdered className="w-4 h-4" />
            Mi Itinerario
          </TabsTrigger>
        </TabsList>

        {/* Grid View - All Events as Cards */}
        <TabsContent value="grid" className="space-y-6 mt-0">
          {/* Filter: Available vs Expired */}
          <div className="flex justify-center">
            <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-full max-w-md">
              <Button
                variant={eventFilter === 'available' ? 'default' : 'ghost'}
                size="sm"
                className="flex-1"
                onClick={() => setEventFilter('available')}
              >
                Disponibles
              </Button>
              <Button
                variant={eventFilter === 'expired' ? 'default' : 'ghost'}
                size="sm"
                className="flex-1"
                onClick={() => setEventFilter('expired')}
              >
                Vencidos
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading && Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-video w-full" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
            
            {!isLoading && events
              ?.filter((event) => {
                const eventDate = new Date(event.endDateTime || event.dateTime);
                const now = new Date();
                const isExpired = eventDate < now;
                return eventFilter === 'expired' ? isExpired : !isExpired;
              })
              .map((event) => {
                const isExpired = eventFilter === 'expired';
                return (
                  <div key={event.id} className={isExpired ? 'opacity-60 grayscale' : ''}>
                    <EventCard
                      event={event}
                      onViewDetails={setSelectedEvent}
                      onMarkAttendance={handleMarkAttendanceClick}
                      hasAttended={attendedEventIds.has(event.id)}
                    />
                  </div>
                );
              })}
          </div>

          {!isLoading && events && events
            .filter((event) => {
              const eventDate = new Date(event.endDateTime || event.dateTime);
              const now = new Date();
              const isExpired = eventDate < now;
              return eventFilter === 'expired' ? isExpired : !isExpired;
            }).length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground">
                {eventFilter === 'expired' 
                  ? 'No hay eventos vencidos.'
                  : 'No hay eventos disponibles por el momento.'}
              </p>
            </div>
          )}
        </TabsContent>

        {/* Itinerary View - Timeline by Day */}
        <TabsContent value="itinerary" className="space-y-6 mt-0">
          {/* Date Navigation */}
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(subDays(selectedDate, 1))}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Anterior</span>
            </Button>
            
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold">
                {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
              </h2>
              {isSameDay(selectedDate, new Date()) && (
                <Badge variant="default" className="mt-1">Hoy</Badge>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {/* Timeline by Hours */}
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : eventsForSelectedDay.length === 0 ? (
            <Card className="p-12">
              <div className="text-center text-muted-foreground">
                <p className="text-lg">No hay eventos programados para este día</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setSelectedDate(new Date())}
                >
                  Ver eventos de hoy
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {sortedHours.map((hour) => {
                const hourEvents = eventsByHour[hour];
                
                return (
                  <div key={hour} className="flex gap-3 sm:gap-4">
                    {/* Hour Label */}
                    <div className="w-12 sm:w-16 flex-shrink-0 pt-1">
                      <div className="text-xs sm:text-sm font-bold text-muted-foreground sticky top-20">
                        {hour}
                      </div>
                    </div>

                    {/* Events for this hour */}
                    <div className="flex-1 space-y-3">
                      {hourEvents.map((event) => {
                        const status = getEventStatus(event);
                        const isInProgress = status === 'in-progress';
                        const isUpcoming = status === 'upcoming';
                        const canAttend = canMarkAttendance(event);

                        return (
                          <Card
                            key={event.id}
                            className={`overflow-hidden transition-all hover:shadow-md cursor-pointer ${
                              isInProgress
                                ? 'border-red-500 border-2 shadow-red-100 dark:shadow-red-900/20'
                                : isUpcoming
                                ? 'border-blue-400 dark:border-blue-600'
                                : 'border-border opacity-75'
                            }`}
                            onClick={() => setSelectedEvent(event)}
                          >
                            {/* Status bar */}
                            <div className={`h-1 ${
                              isInProgress
                                ? 'bg-gradient-to-r from-red-500 via-red-400 to-red-500 animate-pulse'
                                : isUpcoming
                                ? 'bg-blue-500'
                                : 'bg-muted'
                            }`} />
                            
                            <div className="flex gap-3 p-3 sm:p-4">
                              {/* Event Image - Small */}
                              {event.imageUrl && (
                                <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-md overflow-hidden">
                                  <img
                                    src={event.imageUrl}
                                    alt={event.title}
                                    className="object-cover w-full h-full"
                                  />
                                  {isInProgress && (
                                    <div className="absolute inset-0 bg-red-600/20 flex items-center justify-center">
                                      <span className="text-2xl animate-pulse">🔴</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Event Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <h3 className="font-semibold text-sm sm:text-base line-clamp-2 flex-1">
                                    {event.title}
                                  </h3>
                                  {isInProgress && (
                                    <Badge variant="destructive" className="text-xs animate-pulse flex-shrink-0">
                                      En curso
                                    </Badge>
                                  )}
                                </div>

                                {/* Compact info */}
                                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-2">
                                  <span className="font-medium">
                                    {format(parseISO(event.dateTime), 'HH:mm', { locale: es })}
                                  </span>
                                  {event.duration && (
                                    <>
                                      <span>•</span>
                                      <span>{event.duration}</span>
                                    </>
                                  )}
                                  {event.location && (
                                    <>
                                      <span className="hidden sm:inline">•</span>
                                      <span className="truncate max-w-[120px] sm:max-w-none">
                                        {event.location}
                                      </span>
                                    </>
                                  )}
                                </div>

                                {/* Speakers - Only on larger screens */}
                                {event.speakers && event.speakers.length > 0 && (
                                  <p className="text-xs text-muted-foreground line-clamp-1 mb-2 hidden sm:block">
                                    <span className="font-semibold">Ponente:</span> {event.speakers.join(', ')}
                                  </p>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-2 mt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-8 flex-1 sm:flex-none"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedEvent(event);
                                    }}
                                  >
                                    Detalles
                                  </Button>
                                  {canAttend && (
                                    <Button
                                      size="sm"
                                      className="text-xs h-8 flex-1 sm:flex-none"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMarkAttendanceClick(event);
                                      }}
                                    >
                                      ✓ Asistencia
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
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
