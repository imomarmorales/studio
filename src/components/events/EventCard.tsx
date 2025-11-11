'use client';

import { CongressEvent } from '@/lib/types';
import { 
  getEventStatus, 
  formatEventDateTime, 
  getEventStatusLabel 
} from '@/lib/event-utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Trophy } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface EventCardProps {
  event: CongressEvent;
  onClick?: () => void;
  className?: string;
}

export function EventCard({ event, onClick, className }: EventCardProps) {
  const status = getEventStatus(event);
  const isLive = status === 'live';
  const isPast = status === 'past';

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all duration-200 hover:shadow-lg',
        'relative overflow-hidden',
        // Estados visuales
        isLive && 'event-live-border event-live-gradient',
        isPast && 'opacity-60',
        className
      )}
      onClick={onClick}
    >
      {/* Badge de Estado - Esquina superior derecha */}
      <div className="absolute top-2 right-2 z-10">
        <Badge 
          className={cn(
            'font-semibold shadow-md',
            isLive && 'event-live-badge',
            status === 'upcoming' && 'bg-blue-500 hover:bg-blue-600',
            isPast && 'bg-gray-400'
          )}
        >
          {getEventStatusLabel(status)}
        </Badge>
      </div>

      {/* Imagen del Evento */}
      <div className="relative w-full aspect-video overflow-hidden bg-muted">
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Calendar className="h-16 w-16 text-primary/40" />
          </div>
        )}
      </div>

      {/* Contenido */}
      <CardContent className="p-4 space-y-3">
        {/* Título */}
        <h3 className={cn(
          'font-semibold text-lg leading-tight line-clamp-2',
          isLive && 'text-primary'
        )}>
          {event.title}
        </h3>

        {/* Metadata Grid */}
        <div className="space-y-2 text-sm text-muted-foreground">
          {/* Fecha y Hora */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{formatEventDateTime(event.dateTime)}</span>
          </div>

          {/* Ubicación */}
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>

          {/* Puntos */}
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 flex-shrink-0 text-yellow-500" />
            <span className="font-semibold text-foreground">
              {event.points || 100} pts
            </span>
          </div>
        </div>

        {/* Categoría (opcional) */}
        {event.category && (
          <div className="pt-2 border-t">
            <span className="text-xs text-muted-foreground">
              {event.category}
            </span>
          </div>
        )}
      </CardContent>

      {/* Indicador de estado "En Vivo" adicional (barra inferior) */}
      {isLive && (
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-event-live to-transparent" />
      )}
    </Card>
  );
}
