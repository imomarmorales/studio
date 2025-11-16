'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { generateQRToken } from '@/lib/event-utils';
import { calculateDuration } from '@/lib/event-utils';
import { convertImageToBase64, compressImageIfNeeded, validateImageFile } from '@/lib/upload-image';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirebase, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, addDoc, query, orderBy, doc, setDoc } from 'firebase/firestore';
import type { CongressEvent, Participant } from '@/lib/types';
import { Calendar as CalendarIcon, Loader2, PlusCircle, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { TimeSelect } from '@/components/ui/time-select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { EventEditDialog } from '@/components/admin/EventEditDialog';
import { EventQrManagementDialog } from '@/components/admin/EventQrManagementDialog';
import { EventAttendeesDialog } from '@/components/admin/EventAttendeesDialog';
import { EmptyState } from '@/components/admin/EmptyState';
import { EventCard } from '@/components/admin/EventCard';
import { ImportarEventosEjemplo } from '@/components/admin/ImportarEventosEjemplo';
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
  eventDate: z.date({ required_error: 'La fecha del evento es requerida.' }),
  startTime: z.string().min(1, 'La hora de inicio es requerida.'),
  endTime: z.string().optional(),
  location: z.string().min(3, 'La ubicación es requerida.'),
  pointsPerAttendance: z.number().min(1, 'Los puntos deben ser al menos 1.').default(100),
  speakers: z.string().optional(),
  attendanceRules: z.string().optional(),
  imageFile: z.any().optional(),
}).refine((data) => {
  if (data.endTime && data.startTime) {
    // Convertir strings HH:mm a minutos para comparar
    const [startH, startM] = data.startTime.split(':').map(Number);
    const [endH, endM] = data.endTime.split(':').map(Number);
    const startTotalMinutes = startH * 60 + startM;
    const endTotalMinutes = endH * 60 + endM;
    return endTotalMinutes > startTotalMinutes;
  }
  return true;
}, {
  message: 'La hora de fin debe ser posterior a la hora de inicio',
  path: ['endTime'],
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
  const { user, isUserLoading } = useUser();
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
      startTime: '',
      endTime: '',
    },
  });

  const eventsQuery = useMemoFirebase(
    () => {
      if (!firestore) return null;
      if (isUserLoading) return null; // Wait for auth to complete
      if (!user) return null; // No user, no query
      return query(collection(firestore, 'events'), orderBy('dateTime', 'desc'));
    },
    [firestore, user, isUserLoading, refreshKey]
  );
  const { data: events, isLoading, error } = useCollection<CongressEvent>(eventsQuery);

  const handleRefresh = () => setRefreshKey(prev => prev + 1);

  const createQuickEvent = async () => {
    if (!firestore) return;
    setIsSubmitting(true);

    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Evento 1: 9:00 AM - 10:00 AM
      const event1Start = new Date(today);
      event1Start.setHours(9, 0, 0, 0);
      
      const event1End = new Date(today);
      event1End.setHours(10, 0, 0, 0);

      const qrToken1 = generateQRToken(12);
      const duration1 = calculateDuration(event1Start, event1End);

      const quickEvent1: Omit<CongressEvent, 'id'> = {
        title: 'Taller de Innovación',
        description: 'Aprende las últimas tendencias en innovación tecnológica.',
        dateTime: event1Start.toISOString(),
        endDateTime: event1End.toISOString(),
        location: 'Sala A',
        imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNlZjQ0NDQ7c3RvcC1vcGFjaXR5OjEiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmOTczMTY7c3RvcC1vcGFjaXR5OjEiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0idXJsKCNnKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNDAlIiBmb250LXNpemU9IjQ4IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlRhbGxlciBkZSBJbm5vdmFjacOzbjwvdGV4dD48dGV4dCB4PSI1MCUiIHk9IjU1JSIgZm9udC1zaXplPSIyOCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPjk6MDAgQU0gLSAxMDowMCBBTTwvdGV4dD48dGV4dCB4PSI1MCUiIHk9IjcwJSIgZm9udC1zaXplPSIyMCIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuOSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U2FsYSBBPC90ZXh0Pjwvc3ZnPg==',
        pointsPerAttendance: 150,
        qrToken: qrToken1,
        qrValid: true,
        duration: duration1,
        speakers: ['Dr. Carlos Méndez'],
      };

      // Evento 2: 9:00 AM - 10:00 AM (misma hora, diferente sala)
      const event2Start = new Date(today);
      event2Start.setHours(9, 0, 0, 0);
      
      const event2End = new Date(today);
      event2End.setHours(10, 0, 0, 0);

      const qrToken2 = generateQRToken(12);
      const duration2 = calculateDuration(event2Start, event2End);

      const quickEvent2: Omit<CongressEvent, 'id'> = {
        title: 'Workshop de Diseño UX',
        description: 'Fundamentos de experiencia de usuario y diseño de interfaces.',
        dateTime: event2Start.toISOString(),
        endDateTime: event2End.toISOString(),
        location: 'Sala B',
        imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMzYjgyZjY7c3RvcC1vcGFjaXR5OjEiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM4YjVjZjY7c3RvcC1vcGFjaXR5OjEiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0idXJsKCNnKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNDAlIiBmb250LXNpemU9IjQ4IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPldvcmtzaG9wIGRlIERpc2XDsW8gVVg8L3RleHQ+PHRleHQgeD0iNTAlIiB5PSI1NSUiIGZvbnQtc2l6ZT0iMjgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj45OjAwIEFNIC0gMTA6MDAgQU08L3RleHQ+PHRleHQgeD0iNTAlIiB5PSI3MCUiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjkiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlNhbGEgQjwvdGV4dD48L3N2Zz4=',
        pointsPerAttendance: 150,
        qrToken: qrToken2,
        qrValid: true,
        duration: duration2,
        speakers: ['Diseñadora Ana López'],
      };

      // Crear ambos eventos
      await addDoc(collection(firestore, 'events'), quickEvent1);
      await addDoc(collection(firestore, 'events'), quickEvent2);

      toast({
        title: '🎉 Eventos Rápidos Creados',
        description: `2 eventos de prueba para hoy 9am-10am creados exitosamente.`,
      });

      handleRefresh();
    } catch (error) {
      console.error('Error creating quick event:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo crear el evento rápido.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const createTestUsers = async () => {
    if (!firestore) return;
    setIsSubmitting(true);

    try {
      const testUsers = [
        { name: 'María González', email: 'maria.gonzalez@test.com', points: 950, attendanceCount: 8 },
        { name: 'Juan Pérez', email: 'juan.perez@test.com', points: 850, attendanceCount: 7 },
        { name: 'Ana Martínez', email: 'ana.martinez@test.com', points: 750, attendanceCount: 6 },
        { name: 'Carlos Rodríguez', email: 'carlos.rodriguez@test.com', points: 650, attendanceCount: 5 },
        { name: 'Laura Sánchez', email: 'laura.sanchez@test.com', points: 550, attendanceCount: 4 },
        { name: 'Pedro Ramírez', email: 'pedro.ramirez@test.com', points: 450, attendanceCount: 3 },
        { name: 'Sofia Torres', email: 'sofia.torres@test.com', points: 350, attendanceCount: 3 },
        { name: 'Miguel Flores', email: 'miguel.flores@test.com', points: 250, attendanceCount: 2 },
        { name: 'Carmen Díaz', email: 'carmen.diaz@test.com', points: 150, attendanceCount: 1 },
        { name: 'Roberto Vargas', email: 'roberto.vargas@test.com', points: 100, attendanceCount: 1 },
      ];

      let created = 0;
      for (const testUser of testUsers) {
        const userId = `test_${testUser.email.split('@')[0]}`;\n        await setDoc(doc(firestore, 'users', userId), {\n          name: testUser.name,\n          email: testUser.email,\n          points: testUser.points,\n          attendanceCount: testUser.attendanceCount,\n          badges: [],\n          role: 'participant',\n          createdAt: new Date().toISOString(),\n        });\n        created++;\n      }\n\n      toast({\n        title: '👥 Usuarios de Prueba Creados',\n        description: `${created} usuarios con diferentes puntuaciones creados exitosamente.`,\n      });\n    } catch (error) {\n      console.error('Error creating test users:', error);\n      toast({\n        variant: 'destructive',\n        title: 'Error',\n        description: 'No se pudieron crear los usuarios de prueba.',\n      });\n    } finally {\n      setIsSubmitting(false);\n    }\n  };\n\n  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      
      // Convert image to Base64 if provided, otherwise use placeholder
      let imageUrl = `https://picsum.photos/seed/${Date.now()}/800/400`;
      if (data.imageFile) {
        try {
          // Comprimir si es necesario y convertir a Base64
          const compressedFile = await compressImageIfNeeded(data.imageFile, 500);
          imageUrl = await convertImageToBase64(compressedFile);
        } catch (error) {
          console.warn('Error procesando imagen, usando placeholder:', error);
          toast({
            variant: 'destructive',
            title: 'Error con la imagen',
            description: 'No se pudo procesar la imagen. Se usará una imagen predeterminada.',
          });
        }
      }

      // Combine date with start time
      const [startHours, startMinutes] = data.startTime.split(':').map(Number);
      const startDateTime = new Date(data.eventDate);
      startDateTime.setHours(startHours, startMinutes, 0, 0);

      // Combine date with end time if provided
      let endDateTime: Date | undefined;
      let duration: string | undefined;
      if (data.endTime) {
        const [endHours, endMinutes] = data.endTime.split(':').map(Number);
        endDateTime = new Date(data.eventDate);
        endDateTime.setHours(endHours, endMinutes, 0, 0);
        duration = calculateDuration(startDateTime, endDateTime);
      }
      
      const newEvent: Omit<CongressEvent, 'id'> = {
        title: data.title,
        description: data.description,
        dateTime: startDateTime.toISOString(),
        endDateTime: endDateTime?.toISOString(),
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

  const eventDate = form.watch('eventDate');
  const startTime = form.watch('startTime');
  const endTime = form.watch('endTime');
  
  const calculatedDuration = React.useMemo(() => {
    if (!eventDate || !startTime || !endTime) return null;
    
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const start = new Date(eventDate);
    start.setHours(startHours, startMinutes, 0, 0);
    
    const end = new Date(eventDate);
    end.setHours(endHours, endMinutes, 0, 0);
    
    return calculateDuration(start, end);
  }, [eventDate, startTime, endTime]);

  return (
    <AdminAuthGuard>
       <SidebarProvider>
        <AdminSidebar />
        <SidebarInset>
            {/* Mobile Header with Menu Trigger */}
            <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:hidden">
              <SidebarTrigger className="h-10 w-10 -ml-2" />
              <h1 className="text-lg font-semibold">Gestionar Eventos</h1>
            </header>
            
            <div className="space-y-6 p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <PageHeader
                  title="Gestionar Eventos"
                  description="Administra todos los eventos del congreso desde un solo lugar."
                />
                
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    onClick={createQuickEvent} 
                    disabled={isSubmitting}
                    variant="outline"
                    size="lg"
                    className="gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      <>
                        ⚡ 2 Eventos 9am
                      </>
                    )}
                  </Button>

                  <Button 
                    onClick={createTestUsers} 
                    disabled={isSubmitting}
                    variant="outline"
                    size="lg"
                    className="gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      <>
                        👥 10 Usuarios
                      </>
                    )}
                  </Button>
                  
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

                        <FormField
                          control={form.control}
                          name="eventDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Fecha del Evento *</FormLabel>
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
                                        format(field.value, "dd/MM/yyyy")
                                      ) : (
                                        <span>Seleccionar fecha</span>
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="startTime"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Hora de Inicio *</FormLabel>
                                <FormControl>
                                  <TimeSelect 
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Seleccionar hora de inicio"
                                  />
                                </FormControl>
                                <FormDescription className="text-xs">
                                  Selecciona hora y minutos con AM/PM
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="endTime"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Hora de Fin</FormLabel>
                                <FormControl>
                                  <TimeSelect 
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Seleccionar hora de fin"
                                    minTime={startTime}
                                  />
                                </FormControl>
                                <FormDescription className="text-xs">
                                  Debe ser posterior a la hora de inicio
                                </FormDescription>
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
