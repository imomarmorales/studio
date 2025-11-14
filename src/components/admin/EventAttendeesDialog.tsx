'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, getDoc } from 'firebase/firestore';
import type { CongressEvent, Participant } from '@/lib/types';
import { Users, Download, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AttendeeData {
  participantId: string;
  timestamp: any;
  participant?: Participant;
}

interface EventAttendeesDialogProps {
  event: CongressEvent | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventAttendeesDialog({ event, isOpen, onOpenChange }: EventAttendeesDialogProps) {
  const { firestore } = useFirebase();
  const [attendeesWithDetails, setAttendeesWithDetails] = useState<AttendeeData[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const attendeesQuery = useMemoFirebase(
    () => (firestore && event ? query(
      collection(firestore, `events/${event.id}/attendees`),
      orderBy('timestamp', 'desc')
    ) : null),
    [firestore, event]
  );
  
  const { data: attendees, isLoading } = useCollection<AttendeeData>(attendeesQuery);

  // Fetch participant details for each attendee
  useEffect(() => {
    const fetchParticipantDetails = async () => {
      if (!attendees || !firestore) return;
      
      setIsLoadingDetails(true);
      try {
        const attendeesWithParticipants = await Promise.all(
          attendees.map(async (attendee) => {
            const participantDoc = await getDoc(doc(firestore, 'users', attendee.participantId));
            return {
              ...attendee,
              participant: participantDoc.exists() ? { id: participantDoc.id, ...participantDoc.data() } as Participant : undefined,
            };
          })
        );
        setAttendeesWithDetails(attendeesWithParticipants);
      } catch (error) {
        console.error('Error fetching participant details:', error);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    if (isOpen && attendees) {
      fetchParticipantDetails();
    }
  }, [attendees, firestore, isOpen]);

  const handleExportCSV = () => {
    if (!event || !attendeesWithDetails) return;

    // Create CSV content
    const headers = ['Nombre Completo', 'Correo Institucional', 'Fecha de Registro', 'Hora de Registro', 'Puntos Obtenidos'];
    const rows = attendeesWithDetails.map((attendee) => [
      attendee.participant?.name || 'N/A',
      attendee.participant?.email || 'N/A',
      attendee.timestamp?.toDate?.()?.toLocaleDateString('es-ES') || 'N/A',
      attendee.timestamp?.toDate?.()?.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) || 'N/A',
      event.pointsPerAttendance.toString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const fileName = `Asistentes-${event.title.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Asistentes: {event.title}
          </DialogTitle>
          <DialogDescription>
            Lista de participantes que han marcado asistencia a este evento.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between py-2">
          <Badge variant="secondary" className="text-sm">
            {attendees?.length || 0} asistente{attendees && attendees.length !== 1 ? 's' : ''}
          </Badge>
          <Button
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
            disabled={!attendees || attendees.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto border rounded-md">
          {(isLoading || isLoadingDetails) && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && !isLoadingDetails && attendeesWithDetails.length === 0 && (
            <Alert className="m-4">
              <Users className="h-4 w-4" />
              <AlertDescription>
                Aún no hay asistentes registrados para este evento.
              </AlertDescription>
            </Alert>
          )}

          {!isLoading && !isLoadingDetails && attendeesWithDetails.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participante</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="text-right">Fecha Registro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendeesWithDetails.map((attendee, index) => (
                  <TableRow key={`${attendee.participantId}-${index}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={attendee.participant?.photoURL} />
                          <AvatarFallback className="text-xs">
                            {attendee.participant?.name?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {attendee.participant?.name || 'Usuario Desconocido'}
                          </p>
                          <p className="text-xs text-muted-foreground md:hidden">
                            {attendee.participant?.email || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {attendee.participant?.email || 'N/A'}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      <div>
                        {attendee.timestamp?.toDate?.()?.toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {attendee.timestamp?.toDate?.()?.toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={() => onOpenChange(false)} variant="secondary">
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
