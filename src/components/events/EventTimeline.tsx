'use client';

import { useState } from 'react';
import type { CongressEvent } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Award, CalendarDays } from 'lucide-react';
import { getEventStatus } from '@/lib/event-utils';
import { EventDetailsDialog } from './EventDetailsDialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface EventTimelineProps {
  events: CongressEvent[];
  selectedDate?: Date;
}

interface TimelineEvent extends CongressEvent {
  startMinutes: number;
  durationMinutes: number;
  row: number; // For handling overlapping events
}

export function EventTimeline({ events, selectedDate }: EventTimelineProps) {
  const [selectedEvent, setSelectedEvent] = useState<CongressEvent | null>(null);

  // Timeline configuration
  const START_HOUR = 7; // 7:00 AM
  const END_HOUR = 21; // 9:00 PM
  const TOTAL_HOURS = END_HOUR - START_HOUR;
  const MINUTES_PER_HOUR = 60;
  const TOTAL_MINUTES = TOTAL_HOURS * MINUTES_PER_HOUR;

  // Filter events for selected date (if provided)
  const filteredEvents = selectedDate
    ? events.filter(event => {
        const eventDate = new Date(event.dateTime);
        return (
          eventDate.getDate() === selectedDate.getDate() &&
          eventDate.getMonth() === selectedDate.getMonth() &&
          eventDate.getFullYear() === selectedDate.getFullYear()
        );
      })
    : events;

  // Convert events to timeline format
  const timelineEvents: TimelineEvent[] = filteredEvents.map(event => {
    const start = new Date(event.dateTime);
    const end = event.endDateTime ? new Date(event.endDateTime) : new Date(start.getTime() + 4 * 60 * 60 * 1000); // Default +4h
    
    const startMinutes = start.getHours() * 60 + start.getMinutes() - (START_HOUR * 60);
    const endMinutes = end.getHours() * 60 + end.getMinutes() - (START_HOUR * 60);
    const durationMinutes = endMinutes - startMinutes;

    return {
      ...event,
      startMinutes: Math.max(0, startMinutes),
      durationMinutes: Math.max(15, durationMinutes), // Minimum 15 minutes for visibility
      row: 0, // Will be calculated
    };
  });

  // Sort by start time
  timelineEvents.sort((a, b) => a.startMinutes - b.startMinutes);

  // Calculate rows for overlapping events
  const rows: TimelineEvent[][] = [];
  timelineEvents.forEach(event => {
    let placed = false;
    
    // Try to place in existing rows
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const lastEventInRow = row[row.length - 1];
      
      // Check if event fits in this row (no overlap)
      if (lastEventInRow.startMinutes + lastEventInRow.durationMinutes <= event.startMinutes) {
        event.row = i;
        row.push(event);
        placed = true;
        break;
      }
    }
    
    // Create new row if needed
    if (!placed) {
      event.row = rows.length;
      rows.push([event]);
    }
  });

  // Generate hour markers
  const hourMarkers = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
    const hour = START_HOUR + i;
    return {
      hour,
      label: `${hour}:00`,
      position: (i * MINUTES_PER_HOUR / TOTAL_MINUTES) * 100,
    };
  });

  // Calculate current time marker position
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes() - (START_HOUR * 60);
  const currentTimePosition = (currentMinutes / TOTAL_MINUTES) * 100;
  const isCurrentTimeInRange = currentMinutes >= 0 && currentMinutes <= TOTAL_MINUTES;

  // Helper function to calculate event position and width
  const getEventStyle = (event: TimelineEvent) => {
    const left = (event.startMinutes / TOTAL_MINUTES) * 100;
    const width = (event.durationMinutes / TOTAL_MINUTES) * 100;
    return { left: `${left}%`, width: `${Math.max(width, 2)}%` };
  };

  // Get status colors
  const getStatusColor = (event: CongressEvent) => {
    const status = getEventStatus(event);
    switch (status) {
      case 'in-progress':
        return 'border-red-500 bg-red-50 hover:bg-red-100';
      case 'finished':
        return 'border-gray-300 bg-gray-50 hover:bg-gray-100 opacity-70';
      default:
        return 'border-blue-500 bg-blue-50 hover:bg-blue-100';
    }
  };

  const getStatusBadge = (event: CongressEvent) => {
    const status = getEventStatus(event);
    switch (status) {
      case 'in-progress':
        return <Badge className="bg-red-500">En curso</Badge>;
      case 'finished':
        return <Badge variant="secondary">Finalizado</Badge>;
      default:
        return <Badge className="bg-blue-500">Próximo</Badge>;
    }
  };

  if (filteredEvents.length === 0) {
    return (
      <Card className="p-8 text-center">
        <CalendarDays className="mx-auto h-12 w-12 text-gray-400 mb-3" />
        <p className="text-gray-500">No hay eventos programados para este día</p>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Timeline Header */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {filteredEvents.length} {filteredEvents.length === 1 ? 'evento' : 'eventos'}
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Próximo</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>En curso</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span>Finalizado</span>
            </div>
          </div>
        </div>

        {/* Timeline Container */}
        <Card className="p-6">
          <div className="relative">
            {/* Hour markers */}
            <div className="relative h-8 border-b border-gray-300 mb-4">
              {hourMarkers.map(marker => (
                <div
                  key={marker.hour}
                  className="absolute -translate-x-1/2 text-xs text-gray-500"
                  style={{ left: `${marker.position}%` }}
                >
                  <div className="font-medium">{marker.label}</div>
                  <div className="w-px h-2 bg-gray-300 mx-auto mt-1"></div>
                </div>
              ))}
            </div>

            {/* Current time indicator */}
            {isCurrentTimeInRange && (
              <div
                className="absolute top-8 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                style={{ left: `${currentTimePosition}%` }}
              >
                <div className="absolute -top-2 -left-1.5 w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="absolute -top-6 left-2 text-xs font-semibold text-red-600 whitespace-nowrap">
                  Ahora
                </div>
              </div>
            )}

            {/* Events rows */}
            <div className="relative" style={{ minHeight: `${rows.length * 80}px` }}>
              {/* Grid lines for each hour */}
              {hourMarkers.map(marker => (
                <div
                  key={`grid-${marker.hour}`}
                  className="absolute top-0 bottom-0 w-px bg-gray-100"
                  style={{ left: `${marker.position}%` }}
                ></div>
              ))}

              {/* Event blocks */}
              {timelineEvents.map(event => (
                <div
                  key={event.id}
                  className={`absolute h-16 rounded-lg border-2 cursor-pointer transition-all ${getStatusColor(event)}`}
                  style={{
                    ...getEventStyle(event),
                    top: `${event.row * 80}px`,
                  }}
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="p-2 h-full flex flex-col justify-between overflow-hidden">
                    {/* Event header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate" title={event.title}>
                          {event.title}
                        </div>
                        <div className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>
                            {format(new Date(event.dateTime), 'HH:mm', { locale: es })} - 
                            {format(event.endDateTime ? new Date(event.endDateTime) : new Date(new Date(event.dateTime).getTime() + 4 * 60 * 60 * 1000), 'HH:mm', { locale: es })}
                          </span>
                        </div>
                      </div>
                      {getStatusBadge(event)}
                    </div>

                    {/* Event details (visible on wider events) */}
                    {event.durationMinutes > 45 && (
                      <div className="text-xs text-gray-600 flex items-center gap-3">
                        {event.location && (
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </span>
                        )}
                        {event.pointsPerAttendance > 0 && (
                          <span className="flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            {event.pointsPerAttendance}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Mobile-friendly list view for small screens */}
        <div className="md:hidden space-y-2">
          <div className="text-xs text-gray-500 mb-2">
            Vista en lista (pantalla pequeña)
          </div>
          {timelineEvents.map(event => (
            <Card
              key={event.id}
              className={`p-3 cursor-pointer border-l-4 ${getStatusColor(event)}`}
              onClick={() => setSelectedEvent(event)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="font-semibold text-sm">{event.title}</div>
                  <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(event.dateTime), 'HH:mm', { locale: es })} - 
                      {format(event.endDateTime ? new Date(event.endDateTime) : new Date(new Date(event.dateTime).getTime() + 4 * 60 * 60 * 1000), 'HH:mm', { locale: es })}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </div>
                    )}
                    {event.pointsPerAttendance > 0 && (
                      <div className="flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        {event.pointsPerAttendance} puntos
                      </div>
                    )}
                  </div>
                </div>
                {getStatusBadge(event)}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Event Details Dialog */}
      {selectedEvent && (
        <EventDetailsDialog
          event={selectedEvent}
          isOpen={!!selectedEvent}
          onOpenChange={(open) => !open && setSelectedEvent(null)}
          onMarkAttendanceClick={() => {}}
        />
      )}
    </>
  );
}
