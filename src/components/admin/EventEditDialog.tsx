'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { calculateDuration } from '@/lib/event-utils';
import { convertImageToBase64, compressImageIfNeeded, validateImageFile } from '@/lib/upload-image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { CongressEvent } from '@/lib/types';
import { Loader2, Trash2, X, Image as ImageIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { TimeSelect } from '@/components/ui/time-select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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

interface EventEditDialogProps {
  event: CongressEvent | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEventUpdated?: () => void;
}

export function EventEditDialog({ event, isOpen, onOpenChange, onEventUpdated }: EventEditDialogProps) {
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(formSchema),
  });

  // Watch form values for duration calculation (must be before useEffect)
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

  useEffect(() => {
    if (event) {
      const eventDateTime = new Date(event.dateTime);
      const startHours = eventDateTime.getHours().toString().padStart(2, '0');
      const startMinutes = eventDateTime.getMinutes().toString().padStart(2, '0');
      
      let endTimeValue = '';
      if (event.endDateTime) {
        const endDateTime = new Date(event.endDateTime);
        const endHours = endDateTime.getHours().toString().padStart(2, '0');
        const endMinutes = endDateTime.getMinutes().toString().padStart(2, '0');
        endTimeValue = `${endHours}:${endMinutes}`;
      }
      
      form.reset({
        title: event.title,
        description: event.description,
        eventDate: eventDateTime,
        startTime: `${startHours}:${startMinutes}`,
        endTime: endTimeValue,
        location: event.location,
        pointsPerAttendance: event.pointsPerAttendance,
        speakers: event.speakers?.join(', ') || '',
        attendanceRules: event.attendanceRules || '',
      });
      setImagePreview(event.imageUrl || null);
    }
  }, [event, form]);

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
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    form.setValue('imageFile', undefined);
    if (event) {
      setImagePreview(event.imageUrl || null);
    } else {
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: EventFormValues) => {
    if (!firestore || !event) return;
    setIsSubmitting(true);

    try {
      const speakers = data.speakers ? data.speakers.split(',').map(s => s.trim()).filter(Boolean) : [];
      
      // Convert new image to Base64 if provided, keep existing if not
      let imageUrl = event.imageUrl;
      if (data.imageFile) {
        try {
          const compressedFile = await compressImageIfNeeded(data.imageFile, 500);
          imageUrl = await convertImageToBase64(compressedFile);
        } catch (error) {
          console.warn('Error procesando imagen, manteniendo anterior:', error);
          // Mantener la imagen existente si falla
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
      
      const eventRef = doc(firestore, 'events', event.id);
      await updateDoc(eventRef, {
        title: data.title,
        description: data.description,
        dateTime: startDateTime.toISOString(),
        endDateTime: endDateTime?.toISOString() || null,
        location: data.location,
        imageUrl: imageUrl,
        pointsPerAttendance: data.pointsPerAttendance,
        speakers: speakers.length > 0 ? speakers : null,
        duration: duration || null,
        attendanceRules: data.attendanceRules || null,
      });

      toast({
        title: '✅ Evento Actualizado',
        description: `${data.title} ha sido actualizado correctamente.`,
      });
      
      onEventUpdated?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        variant: 'destructive',
        title: 'Error al actualizar evento',
        description: 'No se pudo actualizar el evento.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!firestore || !event) return;
    setIsDeleting(true);

    try {
      const eventRef = doc(firestore, 'events', event.id);
      await deleteDoc(eventRef);

      toast({
        title: '🗑️ Evento Eliminado',
        description: `${event.title} ha sido eliminado.`,
      });
      
      onEventUpdated?.();
      setShowDeleteConfirm(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        variant: 'destructive',
        title: 'Error al eliminar evento',
        description: 'No se pudo eliminar el evento.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!event) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="relative px-6 pt-6 pb-4 border-b">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 h-10 w-10 rounded-full z-50 bg-background/80 hover:bg-background"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
            </Button>
            <DialogTitle className="pr-12">Editar Evento</DialogTitle>
            <DialogDescription>
              Modifica los detalles del evento
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id="edit-event-form">
              {/* Image Upload Section */}
              <FormField
                control={form.control}
                name="imageFile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banner del Evento</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        {imagePreview ? (
                          <div className="relative rounded-lg overflow-hidden border-2 border-dashed">
                            <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
                            {form.getValues('imageFile') && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2"
                                onClick={removeImage}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div 
                            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <ImageIcon className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Haz clic para cambiar imagen</p>
                          </div>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageSelect}
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Cambiar Imagen
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Sube una nueva imagen para actualizar el banner del evento
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
                    <FormLabel>Nombre del Evento</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <Textarea {...field} rows={3} />
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
                    <FormLabel>Fecha del Evento</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "dd/MM/yyyy") : <span>Seleccionar</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora de Inicio</FormLabel>
                      <FormControl>
                        <TimeSelect 
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Hora de inicio"
                        />
                      </FormControl>
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
                          placeholder="Hora de fin"
                          minTime={startTime}
                        />
                      </FormControl>
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
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ubicación</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
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
                        <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="speakers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ponentes (separados por comas)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Dr. Juan Pérez, Dra. Ana García" />
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
                    <FormLabel>Reglas de Asistencia</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Especifica las reglas..." rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </form>
            </Form>
          </div>

          {/* Fixed Footer */}
          <DialogFooter className="border-t px-6 py-4 bg-background">
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting || isDeleting}
                className="w-full sm:w-auto"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
              <div className="flex-1" />
              <Button 
                type="submit" 
                form="edit-event-form"
                disabled={isSubmitting || isDeleting}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El evento "{event.title}" será eliminado permanentemente,
              junto con todos los registros de asistencia asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar Evento'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
