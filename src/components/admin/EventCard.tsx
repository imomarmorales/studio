'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  MapPin, 
  Users as UsersIcon, 
  Trophy, 
  Edit, 
  QrCode, 
  Clock,
  MoreVertical 
} from 'lucide-react';
import type { CongressEvent } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface EventCardProps {
  event: CongressEvent;
  onEdit: (event: CongressEvent) => void;
  onQrManagement: (event: CongressEvent) => void;
  onViewAttendees: (event: CongressEvent) => void;
}

export function EventCard({ event, onEdit, onQrManagement, onViewAttendees }: EventCardProps) {
  const eventDate = new Date(event.dateTime);
  const endDate = event.endDateTime ? new Date(event.endDateTime) : null;
  
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden border-l-4 border-l-primary">
      <div 
        className="h-32 sm:h-40 w-full bg-cover bg-center relative"
        style={{ backgroundImage: `url(${event.imageUrl})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-3 right-3 flex gap-2">
          <Badge variant={event.qrValid ? "default" : "destructive"} className="shadow-lg">
            {event.qrValid ? "QR Activo" : "QR Inválido"}
          </Badge>
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-white font-bold text-lg sm:text-xl line-clamp-2">
            {event.title}
          </h3>
        </div>
      </div>
      
      <CardContent className="p-4 space-y-4">
        {/* Información del evento */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1">
              {format(eventDate, "EEEE, d 'de' MMMM", { locale: es })}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1">
              {format(eventDate, 'HH:mm', { locale: es })}
              {endDate && ` - ${format(endDate, 'HH:mm', { locale: es })}`}
              {event.duration && ` (${event.duration})`}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1 line-clamp-1">{event.location}</span>
          </div>
          
          <div className="flex items-center gap-2 text-primary font-semibold">
            <Trophy className="h-4 w-4 flex-shrink-0" />
            <span>{event.pointsPerAttendance} puntos</span>
          </div>
        </div>

        {/* Ponentes */}
        {event.speakers && event.speakers.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-1">Ponentes:</p>
            <div className="flex flex-wrap gap-1">
              {event.speakers.map((speaker, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {speaker}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-2 pt-2">
          <Button 
            onClick={() => onEdit(event)} 
            variant="outline" 
            size="sm"
            className="flex-1"
          >
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onQrManagement(event)}>
                <QrCode className="mr-2 h-4 w-4" />
                Gestionar QR
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewAttendees(event)}>
                <UsersIcon className="mr-2 h-4 w-4" />
                Ver Asistentes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
