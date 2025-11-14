'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { generateQRToken } from '@/lib/event-utils';
import { calculateDuration } from '@/lib/event-utils';
import { uploadImage, generateUniqueFileName, validateImageFile } from '@/lib/upload-image';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirebase, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, addDoc, query, orderBy, doc } from 'firebase/firestore';
import type { CongressEvent, Participant } from '@/lib/types';
import { Calendar as CalendarIcon, Loader2, PlusCircle, Upload, X, Image as ImageIcon } from 'lucide-react';
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
import { EmptyState } from '@/components/admin/EmptyState';
import { EventCard } from '@/components/admin/EventCard';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const formSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres.'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres.'),
  dateTime: z.date({ required_error: 'La fecha y hora de inicio son requeridas.' }),
  endDateTime: z.date().optional(),
  location: z.string().min(3, 'La ubicación es requerida.'),
  pointsPerAttendance: z.number().min(1, 'Los puntos deben ser al menos 1.').default(100),
  speakers: z.string().optional(),
  attendanceRules: z.string().optional(),
  imageFile: z.any().optional(),
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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      pointsPerAttendance: 100,
      speakers: '',
      attendanceRules: '',
    },
  });

  const eventsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'events'), orderBy('dateTime', 'desc')) : null),
    [firestore, refreshKey]
  );
  const { data: events, isLoading, error } = useCollection<CongressEvent>(eventsQuery);

  const handleRefresh = () => setRefreshKey(prev => prev + 1);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast({
        variant: 'destructive',
        title: 'Error de imagen',
        description: validation.error,
      });
      return;
    }

    form.setValue('imageFile', file);
    
    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    form.setValue('imageFile', undefined);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit: SubmitHandler<EventFormValues> = async (data) => {
    if (!firestore) return;
    setIsSubmitting(true);

    try {
      const qrToken = generateQRToken(12);
      const speakers = data.speakers ? data.speakers.split(',').map(s => s.trim()).filter(Boolean) : [];
      
      // Upload image if provided
      let imageUrl = `https://picsum.photos/seed/${Date.now()}/800/400`;
      if (data.imageFile) {
        const fileName = generateUniqueFileName(data.imageFile.name);
        imageUrl = await uploadImage(data.imageFile, `events/${fileName}`);
      }

      // Calculate duration
      let duration: string | undefined;
      if (data.endDateTime) {
        duration = calculateDuration(data.dateTime, data.endDateTime);
      }
      
      const newEvent: Omit<CongressEvent, 'id'> = {
        title: data.title,
        description: data.description,
        dateTime: data.dateTime.toISOString(),
        endDateTime: data.endDateTime?.toISOString(),
        location: data.location,
        imageUrl: imageUrl,
        pointsPerAttendance: data.pointsPerAttendance || 100,
        qrToken: qrToken,
        qrValid: true,
        speakers: speakers.length > 0 ? speakers : undefined,
        duration: duration,
        attendanceRules: data.attendanceRules || undefined,
      };
      
      await addDoc(collection(firestore, 'events'), newEvent);

      toast({
        title: '¡Evento Creado!',
        description: `${data.title} ha sido añadido correctamente.`,
      });
      
      form.reset();
      removeImage();
      setIsSheetOpen(false);
      handleRefresh();
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

  const startDateTime = form.watch('dateTime');
  const endDateTime = form.watch('endDateTime');
  const calculatedDuration = startDateTime && endDateTime ? calculateDuration(startDateTime, endDateTime) : null;

  return (
    <AdminAuthGuard>
       <SidebarProvider>
        <AdminSidebar />
        <SidebarInset>
            <div className="space-y-6 p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <PageHeader
                  title="Gestionar Eventos"
                  description="Administra todos los eventos del congreso desde un solo lugar."
                />
                
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                  <SheetTrigger asChild>
                    <Button size="lg" className="gap-2">
                      <PlusCircle className="h-5 w-5" />
                      Añadir Evento
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Crear Nuevo Evento</SheetTitle>
                      <SheetDescription>
                        Completa los detalles del evento. Los campos marcados con * son obligatorios.
                      </SheetDescription>
                    </SheetHeader>
                    
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
                        {/* Image Upload */}
                        <FormField
                          control={form.control}
                          name="imageFile"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Banner del Evento</FormLabel>
                              <FormControl>
                                <div className="space-y-3">
                                  {imagePreview ? (
                                    <div className="relative rounded-lg overflow-hidden border-2 border-dashed border-primary">
                                      <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-2 right-2"
                                        onClick={removeImage}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div 
                                      className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                                      onClick={() => fileInputRef.current?.click()}
                                    >
                                      <ImageIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                                      <p className="text-sm text-muted-foreground mb-1">
                                        Haz clic para subir una imagen
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        JPG, PNG o WebP (máx. 5MB)
                                      </p>
                                    </div>
                                  )}
                                  <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageSelect}
                                  />
                                </div>
                              </FormControl>
                              <FormDescription>
                                Esta será la imagen principal que verán los participantes
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre del Evento *</FormLabel>
                              <FormControl>
                                <Input placeholder="Ej. Conferencia de Inteligencia Artificial" {...field} />
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
                              <FormLabel>Descripción *</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Describe de qué tratará el evento..." 
                                  rows={4}
                                  {...field} 
                                />
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
                              <FormLabel>Ubicación *</FormLabel>
                              <FormControl>
                                <Input placeholder="Ej. Auditorio Principal - Edificio A" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="dateTime"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Fecha/Hora Inicio *</FormLabel>
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
                                          format(field.value, "dd/MM/yy HH:mm")
                                        ) : (
                                          <span>Seleccionar</span>
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
                                      disabled={(date) => date < new Date()}
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
                                <FormLabel>Fecha/Hora Fin</FormLabel>
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
                                          format(field.value, "dd/MM/yy HH:mm")
                                        ) : (
                                          <span>Opcional</span>
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
                                      disabled={(date) => date < new Date()}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {calculatedDuration && (
                          <Alert>
                            <AlertDescription className="flex items-center gap-2">
                              <span className="font-semibold">Duración calculada:</span>
                              <span>{calculatedDuration}</span>
                            </AlertDescription>
                          </Alert>
                        )}

                        <FormField
                          control={form.control}
                          name="pointsPerAttendance"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Puntos por Asistencia *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="100" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 100)}
                                />
                              </FormControl>
                              <FormDescription>
                                Puntos que recibirá cada participante al asistir
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="speakers"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ponentes</FormLabel>
                              <FormControl>
                                <Input placeholder="Dr. Juan Pérez, Ing. Ana López" {...field} />
                              </FormControl>
                              <FormDescription>
                                Separados por comas
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="attendanceRules"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reglas de Asistencia</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Ej. Se tomará asistencia durante los primeros 15 minutos..."
                                  rows={3}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex gap-3 pt-4">
                          <Button 
                            type="button" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => {
                              setIsSheetOpen(false);
                              form.reset();
                              removeImage();
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button type="submit" disabled={isSubmitting} className="flex-1 gap-2">
                            {isSubmitting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <PlusCircle className="h-4 w-4" />
                            )}
                            <span>{isSubmitting ? 'Creando...' : 'Crear Evento'}</span>
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Events List */}
              {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="overflow-hidden">
                      <Skeleton className="h-40 w-full" />
                      <div className="p-4 space-y-3">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error al cargar eventos</AlertTitle>
                  <AlertDescription>
                    No se pudieron cargar los eventos. Por favor, intenta de nuevo.
                  </AlertDescription>
                </Alert>
              )}

              {!isLoading && events && events.length === 0 && (
                <EmptyState onCreateEvent={() => setIsSheetOpen(true)} />
              )}

              {!isLoading && events && events.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onEdit={setSelectedEventForEdit}
                      onQrManagement={setSelectedEventForQr}
                      onViewAttendees={setSelectedEventForAttendees}
                    />
                  ))}
                </div>
              )}
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
