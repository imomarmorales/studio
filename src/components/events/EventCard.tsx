'use client';

import { CongressEvent } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Trophy, Clock } from 'lucide-react';
import Image from 'next/image';
import { getEventStatus, formatEventDateTime, formatEventTime, getTimeUntilEvent } from '@/lib/event-utils';
import { cn } from '@/lib/utils';

interface EventCardProps {
  event: CongressEvent;
  onViewDetails: (event: CongressEvent) => void;
  onMarkAttendance?: (event: CongressEvent) => void;
  showAttendanceButton?: boolean;
  hasAttended?: boolean; // Nuevo: indica si ya marcó asistencia
}

export function EventCard({ event, onViewDetails, onMarkAttendance, showAttendanceButton = true, hasAttended = false }: EventCardProps) {
  const status = getEventStatus(event);
  
  const statusConfig = {
    'upcoming': {
      label: 'Próximo',
      variant: 'secondary' as const,
      className: 'border-border bg-background',
      badgeClassName: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    'in-progress': {
      label: 'En Curso',
      variant: 'destructive' as const,
      className: 'border-green-500 bg-green-50 shadow-lg shadow-green-100',
      badgeClassName: 'bg-green-600 text-white',
    },
    'finished': {
      label: 'Finalizado',
      variant: 'outline' as const,
      className: 'border-border bg-muted opacity-75',
      badgeClassName: 'bg-gray-100 text-gray-600',
    },
  };

  const config = statusConfig[status];

  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-300 hover:shadow-md cursor-pointer",
        config.className
      )}
      onClick={() => onViewDetails(event)}
    >
      <div className="relative aspect-video w-full">
        {event.imageUrl && (
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            className={cn(
              "object-cover",
              status === 'finished' && 'grayscale'
            )}
          />
        )}
        <div className="absolute top-3 right-3">
          <Badge className={cn("font-semibold", config.badgeClassName)}>
            {config.label}
          </Badge>
        </div>
        {status === 'in-progress' && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-white text-green-600 border-green-500">
              🟢 AHORA
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-lg line-clamp-2">{event.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {event.description}
          </p>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{formatEventDateTime(event.dateTime)}</span>
          </div>
          
          {status === 'upcoming' && (
            <div className="flex items-center gap-2 text-blue-600 font-medium">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span>{getTimeUntilEvent(event.dateTime)}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Trophy className="h-4 w-4 flex-shrink-0 text-yellow-500" />
            <span className="font-semibold">{event.pointsPerAttendance || 100} puntos</span>
          </div>
        </div>

        {showAttendanceButton && status === 'in-progress' && onMarkAttendance && (
          hasAttended ? (
            <Button 
              className="w-full bg-gray-500 text-white font-semibold cursor-not-allowed"
              disabled
            >
              ✓ Asistencia Registrada
            </Button>
          ) : (
            <Button 
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAttendance(event);
              }}
            >
              Marcar Asistencia
            </Button>
          )
        )}
        
        {status === 'upcoming' && (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(event);
            }}
          >
            Ver Detalles
          </Button>
        )}
        
        {status === 'finished' && (
          <Button 
            variant="ghost" 
            className="w-full text-muted-foreground cursor-default"
            disabled
          >
            Evento Finalizado
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
