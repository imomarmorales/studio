'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirebase, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import type { CongressEvent, Participant } from '@/lib/types';
import { Calendar, Trophy, Award, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatEventTime, getEventStatus } from '@/lib/event-utils';
import { format, addDays, subDays, startOfDay, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  // Get user data
  const userDocRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userData } = useDoc<Participant>(userDocRef);

  // Get events
  const eventsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'events'), orderBy('dateTime', 'asc')) : null),
    [firestore]
  );
  const { data: events, isLoading: eventsLoading } = useCollection<CongressEvent>(eventsQuery);

  // Filter events by selected date
  const eventsForSelectedDate = events?.filter(event => {
    const eventDate = new Date(event.dateTime);
    return isSameDay(eventDate, selectedDate);
  }) || [];

  // Group events by hour
  const eventsByHour = eventsForSelectedDate.reduce((acc, event) => {
    const hour = new Date(event.dateTime).getHours();
    if (!acc[hour]) acc[hour] = [];
    acc[hour].push(event);
    return acc;
  }, {} as Record<number, CongressEvent[]>);

  const handlePreviousDay = () => {
    setSelectedDate(prev => addDays(prev, -1));
  };

  const handleNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  if (isUserLoading || !user) {
    return (
      <div className="space-y-8">
        <PageHeader title="Mi Panel" description="Bienvenido a tu panel de control." />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const isToday = isSameDay(selectedDate, new Date());

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Mi Panel" 
        description={`Bienvenido, ${userData?.name || user.displayName || 'participante'}.`} 
      />

      {/* User Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Puntos Totales</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userData?.points || 0}</div>
            <p className="text-xs text-muted-foreground">Acumulados en eventos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Asistidos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userData?.attendanceCount || 0}</div>
            <p className="text-xs text-muted-foreground">Total de asistencias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Insignias</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userData?.badges?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Desbloqueadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Event List by Hour */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mi Itinerario</CardTitle>
              <CardDescription>
                Eventos organizados por hora
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePreviousDay}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {!isToday && (
                <Button variant="outline" size="sm" onClick={handleToday}>
                  Hoy
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleNextDay}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="text-lg font-semibold text-center pt-2">
            {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
          </div>
        </CardHeader>
        <CardContent>
          {eventsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : eventsForSelectedDate.length > 0 ? (
            <div className="space-y-6">
              {Object.entries(eventsByHour)
                .sort(([hourA], [hourB]) => Number(hourA) - Number(hourB))
                .map(([hour, hourEvents]) => {
                  const hourNum = Number(hour);
                  const hourLabel = `${hourNum.toString().padStart(2, '0')}:00`;
                  
                  return (
                    <div key={hour} className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-20 h-20 rounded-lg bg-primary/10 text-primary font-bold text-lg">
                          {hourLabel}
                        </div>
                        <div className="flex-1 space-y-2">
                          {hourEvents.map(event => {
                            const status = getEventStatus(event);
                            const statusColors = {
                              'upcoming': 'bg-blue-100 text-blue-800 border-blue-200',
                              'in-progress': 'bg-green-100 text-green-800 border-green-500',
                              'finished': 'bg-gray-100 text-gray-600 border-gray-200',
                            };
                            const statusLabels = {
                              'upcoming': 'Próximo',
                              'in-progress': 'En Curso',
                              'finished': 'Finalizado',
                            };
                            
                            return (
                              <div 
                                key={event.id} 
                                className={`p-4 rounded-lg border-2 transition-all ${
                                  status === 'in-progress' 
                                    ? 'border-green-500 bg-green-50' 
                                    : 'border-border bg-card hover:shadow-md'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="font-semibold text-base truncate">{event.title}</h3>
                                      <Badge className={statusColors[status]}>
                                        {statusLabels[status]}
                                      </Badge>
                                    </div>
                                    <div className="space-y-1 text-sm text-muted-foreground">
                                      <div className="flex items-center gap-2">
                                        <Clock className="h-3 w-3 flex-shrink-0" />
                                        <span>
                                          {formatEventTime(event.dateTime)}
                                          {event.endDateTime && ` - ${formatEventTime(event.endDateTime)}`}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <MapPin className="h-3 w-3 flex-shrink-0" />
                                        <span className="truncate">{event.location}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <div className="text-lg font-bold text-primary">
                                      {event.pointsPerAttendance || 100}
                                    </div>
                                    <div className="text-xs text-muted-foreground">puntos</div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No hay eventos programados para {format(selectedDate, "d 'de' MMMM", { locale: es })}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
