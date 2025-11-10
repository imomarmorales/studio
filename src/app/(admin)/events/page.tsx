'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, addDoc, query, orderBy } from 'firebase/firestore';
import type { CongressEvent } from '@/lib/types';
import { Calendar as CalendarIcon, Loader2, PlusCircle, QrCode } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const formSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres.'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres.'),
  dateTime: z.date({ required_error: 'La fecha y hora son requeridas.' }),
  location: z.string().min(3, 'La ubicación es requerida.'),
});

type EventFormValues = z.infer<typeof formSchema>;

function EventQrDialog({ event, isOpen, onOpenChange }: { event: CongressEvent | null, isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    if (!event) return null;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(event.id)}`;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Código QR para: {event.title}</DialogTitle>
                    <DialogDescription>
                        Muestra este código a los asistentes para que puedan registrar su asistencia. Puedes tomar una captura de pantalla o imprimirlo.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center justify-center p-4">
                    <Image
                        src={qrCodeUrl}
                        alt={`Código QR para ${event.title}`}
                        width={300}
                        height={300}
                        className="rounded-lg border shadow-md"
                    />
                </div>
                 <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
            </DialogContent>
        </Dialog>
    );
}


export default function ManageEventsPage() {
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEventForQr, setSelectedEventForQr] = useState<CongressEvent | null>(null);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
    },
  });

  const eventsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'events'), orderBy('dateTime', 'desc')) : null),
    [firestore]
  );
  const { data: events, isLoading, error } = useCollection<CongressEvent>(eventsQuery);

  const onSubmit: SubmitHandler<EventFormValues> = async (data) => {
    if (!firestore) return;
    setIsSubmitting(true);

    try {
      const newEvent: Omit<CongressEvent, 'id'> = {
        title: data.title,
        description: data.description,
        dateTime: data.dateTime.toISOString(),
        location: data.location,
        imageUrl: `https://picsum.photos/seed/${uuidv4()}/600/400`
      };
      
      await addDoc(collection(firestore, 'events'), newEvent);

      toast({
        title: '¡Evento Creado!',
        description: `${data.title} ha sido añadido correctamente.`,
      });
      form.reset();
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        variant: 'destructive',
        title: 'Error al crear el evento',
        description: 'Hubo un problema al guardar el evento. Inténtalo de nuevo.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestionar Eventos"
        description="Crear, editar y administrar los eventos del congreso."
      />
      
      {/* MENSAJE DE PRUEBA */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-12 rounded-lg shadow-2xl">
        <h1 className="text-6xl font-black text-white text-center animate-pulse">
          ✅ PRUEBA QUE ESTOY VINCULADO AL VS CODE ✅
        </h1>
        <p className="text-2xl text-white text-center mt-4 font-semibold">
          Si ves este mensaje, el deploy funcionó correctamente 🚀
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Crear Nuevo Evento</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Evento</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej. Conferencia de IA" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe el evento..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ubicación</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej. Auditorio Principal" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="dateTime"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha y Hora</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                    )}
                                >
                                    {field.value ? (
                                    format(field.value, "PPP")
                                    ) : (
                                    <span>Elige una fecha</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                                initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <PlusCircle />
                    )}
                    <span>{isSubmitting ? 'Creando...' : 'Crear Evento'}</span>
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Eventos Creados</CardTitle>
                    <CardDescription>Esta es la lista de eventos programados.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading && <p>Cargando eventos...</p>}
                    {error && (
                        <Alert variant="destructive">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>No se pudieron cargar los eventos.</AlertDescription>
                        </Alert>
                    )}
                    <div className="space-y-4">
                        {events && events.map((event) => (
                             <Card key={event.id} className="flex items-center justify-between p-4">
                                <div className="space-y-1">
                                    <p className="font-semibold">{event.title}</p>
                                    <p className="text-sm text-muted-foreground">{new Date(event.dateTime).toLocaleString()}</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setSelectedEventForQr(event)}>
                                    <QrCode className="mr-2 h-4 w-4" />
                                    Ver QR
                                </Button>
                            </Card>
                        ))}
                         {!isLoading && events?.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-8">Aún no se han creado eventos.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
      <EventQrDialog event={selectedEventForQr} isOpen={!!selectedEventForQr} onOpenChange={() => setSelectedEventForQr(null)} />
    </div>
  );
}
