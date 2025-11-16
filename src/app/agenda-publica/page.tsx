'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import type { CongressEvent } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Calendar as CalendarIcon, Clock, MapPin, Award } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { format, isSameDay, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';
import { PublicLayout } from '@/components/layout/PublicLayout';

function getEventStatus(event: CongressEvent): 'upcoming' | 'in-progress' | 'completed' {
  const now = new Date();
  const eventStart = new Date(event.dateTime);
  const eventEnd = new Date(event.endDateTime || event.dateTime);

  if (now < eventStart) return 'upcoming';
  if (now >= eventStart && now <= eventEnd) return 'in-progress';
  return 'completed';
}

function EventCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-video w-full" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
    </Card>
  );
}

export default function AgendaPublicaPage() {
  const [events, setEvents] = useState<CongressEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const eventStartDate = new Date(2025, 10, 18); // November is month 10 (0-indexed)
  const eventEndDate = new Date(2025, 10, 24);

  // Obtener eventos de Firestore
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
        const firestore = getFirestore(app);
        
        const eventsQuery = query(collection(firestore, 'events'), orderBy('dateTime', 'asc'));
        const snapshot = await getDocs(eventsQuery);
        const eventsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as CongressEvent[];
        
        setEvents(eventsData);
      } catch (err: any) {
        console.error('Error al cargar eventos:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const inProgressEvents = events.filter(e => getEventStatus(e) === 'in-progress');

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-12 space-y-8" id="agenda">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">
            Agenda de Eventos
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explora todas las conferencias, talleres y actividades del congreso
          </p>
        </div>

        {/* Banner for events in progress */}
        {inProgressEvents.length > 0 && (
          <Alert className="border-red-500 bg-red-50 dark:bg-red-950/20">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 animate-pulse" />
              <div className="flex-1">
                <AlertTitle className="text-red-900 dark:text-red-100 font-bold">
                  🔴 {inProgressEvents.length} {inProgressEvents.length === 1 ? 'Evento en Curso' : 'Eventos en Curso'}
                </AlertTitle>
                <AlertDescription className="text-red-800 dark:text-red-200 mt-1">
                  {inProgressEvents.length === 1 ? (
                    <>
                      <strong>{inProgressEvents[0].title}</strong> está en curso ahora.
                    </>
                  ) : (
                    <>
                      Hay <strong>{inProgressEvents.length} eventos</strong> ocurriendo en este momento.
                    </>
                  )}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error al Cargar Eventos</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* View Mode Tabs */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)} className="space-y-6">
          <div className="flex justify-center">
            <TabsList className="grid w-full sm:w-auto grid-cols-2">
              <TabsTrigger value="list" className="gap-2">
                <Clock className="w-4 h-4" />
                Lista
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-2">
                <CalendarIcon className="w-4 h-4" />
                Calendario
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Calendar View */}
          <TabsContent value="calendar" className="space-y-6 mt-0">
            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 w-full" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
                {(() => {
                  const weekDays = eachDayOfInterval({
                    start: eventStartDate,
                    end: eventEndDate,
                  });

                  return weekDays.map((day) => {
                    const dayEvents = events.filter(event =>
                      isSameDay(new Date(event.dateTime), day)
                    ).sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

                    const isToday = isSameDay(day, new Date());

                    return (
                      <Card
                        key={day.toISOString()}
                        className={`transition-all hover:shadow-lg ${
                          isToday ? 'border-primary border-2' : ''
                        }`}
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
                                  className={`p-2 rounded-md text-xs border transition-all ${
                                    status === 'in-progress'
                                      ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                                      : status === 'upcoming'
                                      ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                                      : 'bg-muted/50 border-border'
                                  }`}
                                >
                                  <div className="font-semibold line-clamp-2 mb-1">{event.title}</div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    {status === 'in-progress' && <span className="animate-pulse">🔴</span>}
                                    <Clock className="w-3 h-3" />
                                    {format(new Date(event.dateTime), 'HH:mm', { locale: es })}
                                  </div>
                                  {event.location && (
                                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                      <MapPin className="w-3 h-3" />
                                      {event.location}
                                    </div>
                                  )}
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
          </TabsContent>

          {/* List View */}
          <TabsContent value="list" className="space-y-6 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading && Array.from({ length: 6 }).map((_, i) => <EventCardSkeleton key={i} />)}
              
              {!loading && events.map((event) => {
                const status = getEventStatus(event);
                return (
                  <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-all">
                    {event.imageUrl && (
                      <div className="relative aspect-video w-full overflow-hidden">
                        <Image
                          src={event.imageUrl}
                          alt={event.title}
                          fill
                          className="object-cover"
                          unoptimized={event.imageUrl.startsWith('data:')}
                        />
                        {status === 'in-progress' && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse">
                            <span>🔴</span> En Curso
                          </div>
                        )}
                        {status === 'upcoming' && (
                          <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                            Próximo
                          </div>
                        )}
                      </div>
                    )}
                    <CardContent className="p-4 space-y-3">
                      <h3 className="font-bold text-lg line-clamp-2">{event.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-3">{event.description}</p>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CalendarIcon className="w-4 h-4" />
                          {format(new Date(event.dateTime), "d 'de' MMMM, yyyy", { locale: es })}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {format(new Date(event.dateTime), 'HH:mm', { locale: es })}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            {event.location}
                          </div>
                        )}
                        {event.pointsPerAttendance && (
                          <div className="flex items-center gap-2 text-primary font-semibold">
                            <Award className="w-4 h-4" />
                            {event.pointsPerAttendance} puntos
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {!loading && events.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">
                  No hay eventos programados por el momento.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* CTA Section */}
        <div className="bg-primary/10 rounded-lg p-8 text-center space-y-4 mt-12">
          <h2 className="text-2xl font-bold">¿Listo para participar?</h2>
          <p className="text-muted-foreground">
            Regístrate para marcar asistencia y ganar puntos en cada evento
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <a href="/registro">Registrarse Ahora</a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="/login">Iniciar Sesión</a>
            </Button>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
