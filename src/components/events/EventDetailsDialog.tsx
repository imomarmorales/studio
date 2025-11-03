'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Calendar, MapPin, Ticket } from 'lucide-react';
import type { CongressEvent } from '@/lib/types';

interface EventDetailsDialogProps {
  event: CongressEvent | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkAttendanceClick: () => void;
}

export function EventDetailsDialog({ event, isOpen, onOpenChange, onMarkAttendanceClick }: EventDetailsDialogProps) {
  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader className="space-y-4">
          <div className="relative w-full h-48 rounded-t-lg overflow-hidden">
            <Image
              src={event.imageUrl || `https://picsum.photos/seed/${event.id}/600/400`}
              alt={`Imagen de ${event.title}`}
              fill
              className="object-cover"
            />
          </div>
          <DialogTitle className="text-2xl font-headline">{event.title}</DialogTitle>
          <div className="space-y-2 text-left">
             <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="mr-2 h-4 w-4" />
                <span>{new Date(event.dateTime).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="mr-2 h-4 w-4" />
                <span>{event.location}</span>
              </div>
          </div>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">{event.description}</p>
        </div>
        <DialogFooter className="sm:justify-start gap-2">
           <Button type="button" onClick={onMarkAttendanceClick}>
                <Ticket className="mr-2 h-4 w-4" />
                Marcar Asistencia
            </Button>
           <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                Cerrar
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
