'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { generateQRToken } from '@/lib/event-utils';
import { calculateDuration } from '@/lib/event-utils';
import { convertImageToBase64, compressImageIfNeeded, validateImageFile } from '@/lib/upload-image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, addDoc, query, orderBy } from 'firebase/firestore';
import type { CongressEvent } from '@/lib/types';
import { Calendar as CalendarIcon, Loader2, PlusCircle, Upload, X, Image as ImageIcon, Check, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { TimeSelect } from '@/components/ui/time-select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"


const formSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres.'),
  description: z.string().optional(),
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

const locations = [
  { value: "Auditorio \"Enrique Collado Sámano\"", label: "Auditorio \"Enrique Collado Sámano\"" },
  { value: "Auditorio Interactivo FIT", label: "Auditorio Interactivo FIT" },
]

export default function ManageEventsPage() {
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
  const [openPopover, setOpenPopover] = useState(false);

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
        attendanceRules: data.attendanceRules,
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
    } catch (error: any) {
      console.error('Error creating event:', error);
      toast({
        variant: 'destructive',
        title: 'Error al crear el evento',
        description: error.message,
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

  const eventStartDate = new Date(2025, 10, 18); // November 18, 2025
  const eventEndDate = new Date(2025, 10, 24); // November 24, 2025

  return (
    <>
      <div className="flex items-center justify-between">
          <div className="hidden sm:block" />
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
                      <FormLabel>Descripción</FormLabel>
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
                    <FormItem className="flex flex-col">
                      <FormLabel>Ubicación *</FormLabel>
                      <Popover open={openPopover} onOpenChange={setOpenPopover}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? locations.find(
                                    (location) => location.value === field.value
                                  )?.label ?? field.value
                                : "Seleccionar o escribir ubicación..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <Command>
                            <CommandInput
                              placeholder="Buscar o escribir ubicación..."
                              onValueChange={(value) => form.setValue("location", value)}
                              value={field.value}
                            />
                            <CommandList>
                              <CommandEmpty>No se encontró la ubicación.</CommandEmpty>
                              <CommandGroup>
                                {locations.map((location) => (
                                  <CommandItem
                                    value={location.label}
                                    key={location.value}
                                    onSelect={() => {
                                      form.setValue("location", location.value)
                                      setOpenPopover(false)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        location.value === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {location.label}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Puedes seleccionar una de la lista o escribir una ubicación personalizada.
                      </FormDescription>
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
                            disabled={(date) =>
                                date < eventStartDate || date > eventEndDate
                            }
                            defaultMonth={eventStartDate}
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
      
      <div className="mt-6">
        {/* Events List */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="overflow-hidden rounded-lg border">
                <Skeleton className="h-40 w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
    </>
  );
}
