'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, addDoc, deleteDoc, doc, updateDoc, query, orderBy, getDocs, getFirestore } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Upload, Loader2, GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { convertImageToBase64, compressImageIfNeeded, validateImageFile } from '@/lib/upload-image';
import Image from 'next/image';
import { Speaker } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

// Speaker Form Schema
const speakerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  title: z.string().min(2, 'El título debe tener al menos 2 caracteres'),
  institution: z.string().optional(),
  description: z.string().min(20, 'La descripción debe tener al menos 20 caracteres'),
  photo: z.any(),
});

type SpeakerFormValues = z.infer<typeof speakerSchema>;

function SpeakersManagementContent() {
  const { toast } = useToast();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const form = useForm<SpeakerFormValues>({
    resolver: zodResolver(speakerSchema),
    defaultValues: {
      name: '',
      title: '',
      institution: '',
      description: '',
    },
  });

  // Cargar speakers
  const loadSpeakers = async () => {
    try {
      if (!getApps().length) {
        initializeApp(firebaseConfig);
      }
      const db = getFirestore();
      const speakersRef = collection(db, 'speakers');
      const q = query(speakersRef, orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      
      const speakersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Speaker[];
      
      setSpeakers(speakersData);
    } catch (error) {
      console.error('Error loading speakers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSpeakers();
  }, []);

  // Image handlers
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    try {
      const compressed = await compressImageIfNeeded(file);
      const base64 = await convertImageToBase64(compressed);
      setPhotoPreview(base64);
      form.setValue('photo', base64);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo procesar la imagen.',
      });
    }
  };

  const onSubmit = async (data: SpeakerFormValues) => {
    if (!data.photo) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Por favor selecciona una foto.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (!getApps().length) {
        initializeApp(firebaseConfig);
      }
      const db = getFirestore();
      
      const order = speakers.length;
      await addDoc(collection(db, 'speakers'), {
        name: data.name,
        title: data.title,
        institution: data.institution || '',
        description: data.description,
        photo: data.photo,
        order,
        createdAt: new Date(),
      });

      toast({
        title: '✅ Ponente agregado',
        description: 'El ponente ha sido agregado exitosamente.',
      });

      form.reset();
      setPhotoPreview(null);
      if (fileRef.current) fileRef.current.value = '';
      loadSpeakers(); // Recargar lista
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo agregar el ponente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteSpeaker = async (id: string) => {
    try {
      if (!getApps().length) {
        initializeApp(firebaseConfig);
      }
      const db = getFirestore();
      
      await deleteDoc(doc(db, 'speakers', id));
      toast({
        title: 'Ponente eliminado',
        description: 'El ponente ha sido eliminado.',
      });
      loadSpeakers(); // Recargar lista
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo eliminar el ponente.',
      });
    }
  };

  const moveUp = async (speaker: Speaker, index: number) => {
    if (index === 0) return;
    try {
      if (!getApps().length) {
        initializeApp(firebaseConfig);
      }
      const db = getFirestore();
      
      const prevSpeaker = speakers[index - 1];
      await updateDoc(doc(db, 'speakers', speaker.id), { order: index - 1 });
      await updateDoc(doc(db, 'speakers', prevSpeaker.id), { order: index });
      loadSpeakers(); // Recargar lista
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo reordenar.',
      });
    }
  };

  const moveDown = async (speaker: Speaker, index: number) => {
    if (index === speakers.length - 1) return;
    try {
      if (!getApps().length) {
        initializeApp(firebaseConfig);
      }
      const db = getFirestore();
      
      const nextSpeaker = speakers[index + 1];
      await updateDoc(doc(db, 'speakers', speaker.id), { order: index + 1 });
      await updateDoc(doc(db, 'speakers', nextSpeaker.id), { order: index });
      loadSpeakers(); // Recargar lista
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo reordenar.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Speaker Form */}
      <Card>
        <CardHeader>
          <CardTitle>Agregar Nuevo Ponente</CardTitle>
          <CardDescription>
            Completa la información del ponente. La foto debe ser JPG/PNG y menor a 500KB.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left column - Form fields */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Completo *</FormLabel>
                        <FormControl>
                          <Input placeholder="Dr. Juan Pérez" {...field} />
                        </FormControl>
                        <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título/Cargo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Dr. en Ciencias de la Computación" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="institution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institución (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Universidad Nacional" {...field} />
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
                    <FormLabel>Biografía/Descripción *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Breve biografía del ponente..."
                        className="min-h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Right column - Photo upload */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="photo"
                render={() => (
                  <FormItem>
                    <FormLabel>Foto del Ponente *</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        <Input
                          ref={fileRef}
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoSelect}
                          className="cursor-pointer"
                        />
                        {photoPreview && (
                          <div className="relative w-48 h-48 mx-auto border-4 border-primary/20 rounded-full overflow-hidden">
                            <Image
                              src={photoPreview}
                              alt="Preview"
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        )}
                        {!photoPreview && (
                          <div className="w-48 h-48 mx-auto border-2 border-dashed rounded-full flex items-center justify-center text-muted-foreground">
                            <Upload className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Agregando...
              </>
            ) : (
              'Agregar Ponente'
            )}
          </Button>
        </form>
      </Form>
    </CardContent>
  </Card>

  {/* Speakers List */}
  <Card>
    <CardHeader>
      <CardTitle>Ponentes Registrados ({speakers?.length || 0})</CardTitle>
      <CardDescription>
        Lista de ponentes en orden de aparición. Usa las flechas para reordenar.
      </CardDescription>
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : speakers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No hay ponentes registrados. Agrega el primero usando el formulario de arriba.
        </div>
      ) : (
        <div className="space-y-4">
          {speakers.map((speaker, index) => (
            <div
              key={speaker.id}
              className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              {/* Photo */}
              <div className="relative w-24 h-24 flex-shrink-0 mx-auto md:mx-0">
                <Image
                  src={speaker.photo}
                  alt={speaker.name}
                  fill
                  className="rounded-full object-cover border-2 border-primary/20"
                  unoptimized
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 text-center md:text-left">
                <h3 className="font-semibold text-lg truncate">{speaker.name}</h3>
                <p className="text-sm text-muted-foreground">{speaker.title}</p>
                {speaker.institution && (
                  <p className="text-sm text-muted-foreground italic">{speaker.institution}</p>
                )}
                <p className="text-sm mt-2 line-clamp-2">{speaker.description}</p>
              </div>

              {/* Actions */}
              <div className="flex md:flex-col gap-2 justify-center md:justify-start">
                <Badge variant="outline" className="h-fit">
                  #{index + 1}
                </Badge>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => moveUp(speaker, index)}
                    disabled={index === 0}
                  >
                    ↑
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => moveDown(speaker, index)}
                    disabled={index === speakers.length - 1}
                  >
                    ↓
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteSpeaker(speaker.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
</div>
  );
}

export default function SpeakersPage() {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        {/* Mobile Header with Menu Trigger */}
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:hidden">
          <SidebarTrigger className="h-10 w-10 -ml-2" />
          <h1 className="text-lg font-semibold">Gestionar Ponentes</h1>
        </header>
        
        <SpeakersManagementContent />
      </SidebarInset>
    </SidebarProvider>
  );
}
