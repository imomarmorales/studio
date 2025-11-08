'use client';

import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, Query, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { CongressEvent } from '@/lib/types';
import Image from 'next/image';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Download, QrCode } from 'lucide-react';


function EventQrDialog({ event, isOpen, onOpenChange }: { event: CongressEvent | null, isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    if (!event) return null;

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(event.id)}`;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Código QR para: {event.title}</DialogTitle>
                    <DialogDescription>
                        Muestra este código para que los participantes registren su asistencia. Puedes descargarlo o tomarle una captura.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center justify-center p-4 bg-white rounded-lg">
                    <Image
                        src={qrCodeUrl}
                        alt={`QR code for ${event.title}`}
                        width={250}
                        height={250}
                    />
                </div>
                <DialogFooter>
                    <Button asChild>
                        <a href={qrCodeUrl} download={`qr-${event.id}.png`}>
                            <Download className="mr-2 h-4 w-4" />
                            Descargar QR
                        </a>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export default function ManageEventsPage() {
    const { toast } = useToast();
    const { firestore } = useFirebase();
    const [selectedEventForQr, setSelectedEventForQr] = useState<CongressEvent | null>(null);

    const eventsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'congressEvents')) as Query<CongressEvent>;
    }, [firestore]);

    const { data: events, isLoading: areEventsLoading } = useCollection<CongressEvent>(eventsQuery);


    const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!firestore) return;

        const formData = new FormData(e.currentTarget);
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const dateTime = formData.get('dateTime') as string;
        const location = formData.get('location') as string;
        const imageUrl = formData.get('imageUrl') as string;

        if (!title || !dateTime) {
            toast({ variant: 'destructive', title: 'Error', description: 'El título y la fecha son requeridos.' });
            return;
        }

        const newEventRef = doc(collection(firestore, 'congressEvents'));
        
        const newEvent: Omit<CongressEvent, 'id'> & { createdAt: any } = {
            title,
            description,
            dateTime: new Date(dateTime).toISOString(),
            location,
            imageUrl: imageUrl || `https://picsum.photos/seed/${newEventRef.id}/600/400`,
            createdAt: serverTimestamp(),
        };

        try {
            await addDocumentNonBlocking(collection(firestore, 'congressEvents'), newEvent);

            toast({
                title: "Evento Creado",
                description: `${title} ha sido agregado correctamente.`,
            });
            (e.target as HTMLFormElement).reset();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error al crear evento",
                description: error.message,
            });
        }
    };


  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestionar Eventos"
        description="Crear, editar y administrar los eventos del congreso."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                <CardTitle>Crear Nuevo Evento</CardTitle>
                <CardDescription>
                    Completa el formulario para añadir un nuevo evento a la agenda.
                </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreateEvent} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Nombre del Evento</Label>
                            <Input id="title" name="title" placeholder="Conferencia de IA" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Descripción</Label>
                            <Textarea id="description" name="description" placeholder="Una plática sobre el futuro de..." />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="dateTime">Fecha y Hora</Label>
                            <Input id="dateTime" name="dateTime" type="datetime-local" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location">Ubicación</Label>
                            <Input id="location" name="location" placeholder="Auditorio Principal" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="imageUrl">URL de la Imagen (Opcional)</Label>
                            <Input id="imageUrl" name="imageUrl" placeholder="https://picsum.photos/..." />
                        </div>
                        <Button type="submit">Crear Evento</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-2">
             <Card>
                <CardHeader>
                    <CardTitle>Eventos Creados</CardTitle>
                    <CardDescription>
                        Esta es la lista de eventos actuales en la plataforma.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {areEventsLoading && <p>Cargando eventos...</p>}
                        {!areEventsLoading && (!events || events.length === 0) && <p>Aún no has creado ningún evento.</p>}
                        {events?.map(event => (
                            <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <h4 className="font-semibold">{event.title}</h4>
                                    <p className="text-sm text-muted-foreground">{new Date(event.dateTime).toLocaleString()}</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setSelectedEventForQr(event)}>
                                    <QrCode className="mr-2 h-4 w-4" />
                                    Ver QR
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
             </Card>
        </div>
      </div>

      <EventQrDialog 
        event={selectedEventForQr} 
        isOpen={!!selectedEventForQr} 
        onOpenChange={(isOpen) => !isOpen && setSelectedEventForQr(null)} 
      />
    </div>
  );
}
