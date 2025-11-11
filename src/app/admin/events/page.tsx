'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { generateQRToken } from '@/lib/event-utils';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirebase, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, addDoc, query, orderBy, doc } from 'firebase/firestore';
import type { CongressEvent, Participant } from '@/lib/types';
import { Calendar as CalendarIcon, Loader2, PlusCircle, QrCode, Edit, Users as UsersIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { EventEditDialog } from '@/components/admin/EventEditDialog';
import { EventQrManagementDialog } from '@/components/admin/EventQrManagementDialog';
import { EventAttendeesDialog } from '@/components/admin/EventAttendeesDialog';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres.'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres.'),
  dateTime: z.date({ required_error: 'La fecha y hora de inicio son requeridas.' }),
  endDateTime: z.date().optional(),
  location: z.string().min(3, 'La ubicación es requerida.'),
  pointsPerAttendance: z.number().min(1, 'Los puntos deben ser al menos 1.').default(100),
  speakers: z.string().optional(),
  duration: z.string().optional(),
  attendanceRules: z.string().optional(),
}).refine((data) => {
  if (data.endDateTime && data.dateTime) {
    return data.endDateTime > data.dateTime;
  }
  return true;
}, {
  message: 'La fecha de fin debe ser posterior a la fecha de inicio',
  path: ['endDateTime'],
});

type EventFormValues = z.infer<typeof formSchema>;

// Remove EventQrDialog since we now use EventQrManagementDialog

function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();

  const userDocRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  
  const { data: participant, isLoading: isParticipantLoading } = useDoc<Participant>(userDocRef);

  useEffect(() => {
    const isLoading = isUserLoading || isParticipantLoading;
    if (!isLoading) {
      if (!user || participant?.role !== 'admin') {
        router.push('/login');
      }
    }
  }, [isUserLoading, isParticipantLoading, user, participant, router]);

  const isLoading = isUserLoading || isParticipantLoading;

  if (isLoading || !user || participant?.role !== 'admin') {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
            </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}


function ManageEventsContent() {
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEventForQr, setSelectedEventForQr] = useState<CongressEvent | null>(null);
  const [selectedEventForEdit, setSelectedEventForEdit] = useState<CongressEvent | null>(null);
  const [selectedEventForAttendees, setSelectedEventForAttendees] = useState<CongressEvent | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      pointsPerAttendance: 100,
      speakers: '',
      duration: '',
      attendanceRules: '',
    },
  });

  const eventsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'events'), orderBy('dateTime', 'desc')) : null),
    [firestore, refreshKey]
  );
  const { data: events, isLoading, error } = useCollection<CongressEvent>(eventsQuery);

  const handleRefresh = () => setRefreshKey(prev => prev + 1);

  const onSubmit: SubmitHandler<EventFormValues> = async (data) => {
    if (!firestore) return;
    setIsSubmitting(true);

    try {
      const qrToken = generateQRToken(12);
      const speakers = data.speakers ? data.speakers.split(',').map(s => s.trim()).filter(Boolean) : [];
      
      const newEvent: Omit<CongressEvent, 'id'> = {
        title: data.title,
        description: data.description,
        dateTime: data.dateTime.toISOString(),
        endDateTime: data.endDateTime?.toISOString(),
        location: data.location,
        imageUrl: `https://picsum.photos/seed/${uuidv4()}/600/400`,
        pointsPerAttendance: data.pointsPerAttendance || 100,
        qrToken: qrToken,
        qrValid: true,
        speakers: speakers.length > 0 ? speakers : undefined,
        duration: data.duration || undefined,
        attendanceRules: data.attendanceRules || undefined,
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
    <AdminAuthGuard>
       <SidebarProvider>
        <AdminSidebar />
        <SidebarInset>
            <div className="space-y-8 p-4 sm:p-6 lg:p-8">
            <PageHeader
                title="Gestionar Eventos"
                description="Crear, editar y administrar los eventos del congreso."
            />
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
                                <FormLabel>Fecha y Hora de Inicio</FormLabel>
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
                                            format(field.value, "PPP HH:mm")
                                            ) : (
                                            <span>Elige fecha y hora</span>
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
                        <FormField
                            control={form.control}
                            name="endDateTime"
                            render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Fecha y Hora de Fin (Opcional)</FormLabel>
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
                                            format(field.value, "PPP HH:mm")
                                            ) : (
                                            <span>Elige fecha y hora de fin</span>
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
                                        disabled={(date) => date < new Date("1900-01-01")}
                                        initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="pointsPerAttendance"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Puntos por Asistencia</FormLabel>
                                <FormControl>
                                <Input 
                                    type="number" 
                                    placeholder="100" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 100)}
                                />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="speakers"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ponentes (separados por comas)</FormLabel>
                                <FormControl>
                                <Input placeholder="Dr. Juan Pérez, Ing. Ana López" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="duration"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Duración (Opcional)</FormLabel>
                                <FormControl>
                                <Input placeholder="2 horas" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="attendanceRules"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Reglas de Asistencia (Opcional)</FormLabel>
                                <FormControl>
                                <Textarea placeholder="Reglas especiales para este evento..." {...field} />
                                </FormControl>
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
                                    <Card key={event.id} className="p-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold">{event.title}</p>
                                                    <Badge variant={event.qrValid ? "default" : "destructive"} className="text-xs">
                                                        {event.qrValid ? "QR Válido" : "QR Invalidado"}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    📅 {new Date(event.dateTime).toLocaleDateString('es-ES', {
                                                        weekday: 'short',
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    📍 {event.location} • 🏆 {event.pointsPerAttendance} pts
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <Button variant="outline" size="sm" onClick={() => setSelectedEventForEdit(event)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Editar
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={() => setSelectedEventForQr(event)}>
                                                    <QrCode className="mr-2 h-4 w-4" />
                                                    QR
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={() => setSelectedEventForAttendees(event)}>
                                                    <UsersIcon className="mr-2 h-4 w-4" />
                                                    Asistentes
                                                </Button>
                                            </div>
                                        </div>
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
            
            {/* Dialogs */}
            <EventEditDialog
                event={selectedEventForEdit}
                isOpen={!!selectedEventForEdit}
                onOpenChange={() => setSelectedEventForEdit(null)}
                onEventUpdated={handleRefresh}
            />
            <EventQrManagementDialog
                event={selectedEventForQr}
                isOpen={!!selectedEventForQr}
                onOpenChange={() => setSelectedEventForQr(null)}
                onEventUpdated={handleRefresh}
            />
            <EventAttendeesDialog
                event={selectedEventForAttendees}
                isOpen={!!selectedEventForAttendees}
                onOpenChange={() => setSelectedEventForAttendees(null)}
            />
            </div>
        </SidebarInset>
       </SidebarProvider>
    </AdminAuthGuard>
  );
}

export default function ManageEventsPage() {
    return (
        <FirebaseClientProvider>
            <ManageEventsContent />
        </FirebaseClientProvider>
    );
}
