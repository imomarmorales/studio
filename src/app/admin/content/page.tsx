'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCollection, useFirebase, useMemoFirebase, useUser } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Upload, Loader2, Image as ImageIcon, GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { convertImageToBase64, compressImageIfNeeded, validateImageFile } from '@/lib/upload-image';
import Image from 'next/image';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

interface Sponsor {
  id: string;
  name: string;
  logo: string;
  order: number;
}

interface FeaturedEvent {
  id: string;
  title: string;
  description: string;
  image: string;
  badge1?: string;
  badge2?: string;
  order: number;
}

// Sponsor Form Schema
const sponsorSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  logo: z.any(),
});

// Featured Event Form Schema
const eventSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres'),
  description: z.string().min(20, 'La descripción debe tener al menos 20 caracteres'),
  badge1: z.string().optional(),
  badge2: z.string().optional(),
  image: z.any(),
});

type SponsorFormValues = z.infer<typeof sponsorSchema>;
type EventFormValues = z.infer<typeof eventSchema>;

function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  
  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

function ContentManagementContent() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [sponsorImagePreview, setSponsorImagePreview] = useState<string | null>(null);
  const [eventImagePreview, setEventImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sponsorFileRef = useRef<HTMLInputElement>(null);
  const eventFileRef = useRef<HTMLInputElement>(null);

  const sponsorForm = useForm<SponsorFormValues>({
    resolver: zodResolver(sponsorSchema),
    defaultValues: { name: '' },
  });

  const eventForm = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      badge1: '',
      badge2: '',
    },
  });

  // Queries
  const sponsorsQuery = useMemoFirebase(
    () => {
      if (!firestore) return null;
      if (isUserLoading) return null;
      if (!user) return null;
      return query(collection(firestore, 'sponsors'), orderBy('order', 'asc'));
    },
    [firestore, user, isUserLoading]
  );
  const { data: sponsors } = useCollection<Sponsor>(sponsorsQuery);

  const eventsQuery = useMemoFirebase(
    () => {
      if (!firestore) return null;
      if (isUserLoading) return null;
      if (!user) return null;
      return query(collection(firestore, 'featuredEvents'), orderBy('order', 'asc'));
    },
    [firestore, user, isUserLoading]
  );
  const { data: featuredEvents } = useCollection<FeaturedEvent>(eventsQuery);

  // Sponsor handlers
  const handleSponsorImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setSponsorImagePreview(base64);
      sponsorForm.setValue('logo', base64);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo procesar la imagen.',
      });
    }
  };

  const onSubmitSponsor = async (data: SponsorFormValues) => {
    if (!firestore || !data.logo) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Por favor selecciona un logo.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const order = sponsors ? sponsors.length : 0;
      await addDoc(collection(firestore, 'sponsors'), {
        name: data.name,
        logo: data.logo,
        order,
      });

      toast({
        title: '✅ Patrocinador agregado',
        description: 'El patrocinador ha sido agregado exitosamente.',
      });

      sponsorForm.reset();
      setSponsorImagePreview(null);
      if (sponsorFileRef.current) sponsorFileRef.current.value = '';
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo agregar el patrocinador.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteSponsor = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'sponsors', id));
      toast({
        title: 'Patrocinador eliminado',
        description: 'El patrocinador ha sido eliminado.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo eliminar el patrocinador.',
      });
    }
  };

  // Event handlers
  const handleEventImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setEventImagePreview(base64);
      eventForm.setValue('image', base64);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo procesar la imagen.',
      });
    }
  };

  const onSubmitEvent = async (data: EventFormValues) => {
    if (!firestore || !data.image) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Por favor selecciona una imagen.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const order = featuredEvents ? featuredEvents.length : 0;
      await addDoc(collection(firestore, 'featuredEvents'), {
        title: data.title,
        description: data.description,
        image: data.image,
        badge1: data.badge1 || null,
        badge2: data.badge2 || null,
        order,
      });

      toast({
        title: '✅ Evento agregado',
        description: 'El evento destacado ha sido agregado exitosamente.',
      });

      eventForm.reset();
      setEventImagePreview(null);
      if (eventFileRef.current) eventFileRef.current.value = '';
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo agregar el evento.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteEvent = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'featuredEvents', id));
      toast({
        title: 'Evento eliminado',
        description: 'El evento destacado ha sido eliminado.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo eliminar el evento.',
      });
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Contenido</h1>
        <p className="text-muted-foreground">
          Administra patrocinadores y eventos destacados de la página principal
        </p>
      </div>

      <Tabs defaultValue="sponsors" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sponsors">Patrocinadores</TabsTrigger>
          <TabsTrigger value="events">Eventos Destacados</TabsTrigger>
        </TabsList>

        {/* Sponsors Tab */}
        <TabsContent value="sponsors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agregar Patrocinador</CardTitle>
              <CardDescription>
                Sube el logo de un patrocinador (máx. 500KB)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...sponsorForm}>
                <form onSubmit={sponsorForm.handleSubmit(onSubmitSponsor)} className="space-y-6">
                  <FormField
                    control={sponsorForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Patrocinador *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: TechCorp" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={sponsorForm.control}
                    name="logo"
                    render={() => (
                      <FormItem>
                        <FormLabel>Logo *</FormLabel>
                        <FormControl>
                          <div className="space-y-4">
                            <input
                              ref={sponsorFileRef}
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={handleSponsorImageSelect}
                              className="hidden"
                              id="sponsor-logo-upload"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => sponsorFileRef.current?.click()}
                              className="w-full"
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              Seleccionar Logo
                            </Button>

                            {sponsorImagePreview && (
                              <div className="relative w-full h-32 border rounded-lg overflow-hidden bg-muted">
                                <Image
                                  src={sponsorImagePreview}
                                  alt="Preview"
                                  fill
                                  className="object-contain p-4"
                                  unoptimized
                                />
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Agregando...
                      </>
                    ) : (
                      'Agregar Patrocinador'
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Patrocinadores Actuales</CardTitle>
              <CardDescription>
                Total: {sponsors?.length || 0}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!sponsors || sponsors.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay patrocinadores agregados aún.
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {sponsors.map((sponsor) => (
                    <Card key={sponsor.id} className="relative group">
                      <CardContent className="p-4">
                        <div className="relative h-24 mb-2">
                          <Image
                            src={sponsor.logo}
                            alt={sponsor.name}
                            fill
                            className="object-contain"
                            unoptimized={sponsor.logo.startsWith('data:')}
                          />
                        </div>
                        <p className="text-sm font-medium text-center truncate">
                          {sponsor.name}
                        </p>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => deleteSponsor(sponsor.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Eliminar
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Featured Events Tab */}
        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agregar Evento Destacado</CardTitle>
              <CardDescription>
                Crea un evento para mostrar en la página principal (máx. 500KB)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...eventForm}>
                <form onSubmit={eventForm.handleSubmit(onSubmitEvent)} className="space-y-6">
                  <FormField
                    control={eventForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Conferencia IA" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={eventForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe el evento destacado..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={eventForm.control}
                      name="badge1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Badge 1</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Top Rated" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={eventForm.control}
                      name="badge2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Badge 2</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: 5 Days" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={eventForm.control}
                    name="image"
                    render={() => (
                      <FormItem>
                        <FormLabel>Imagen *</FormLabel>
                        <FormControl>
                          <div className="space-y-4">
                            <input
                              ref={eventFileRef}
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={handleEventImageSelect}
                              className="hidden"
                              id="event-image-upload"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => eventFileRef.current?.click()}
                              className="w-full"
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              Seleccionar Imagen
                            </Button>

                            {eventImagePreview && (
                              <div className="relative w-full h-64 border rounded-lg overflow-hidden">
                                <Image
                                  src={eventImagePreview}
                                  alt="Preview"
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Agregando...
                      </>
                    ) : (
                      'Agregar Evento'
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Eventos Destacados Actuales</CardTitle>
              <CardDescription>
                Total: {featuredEvents?.length || 0} (máx. 3 se mostrarán)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!featuredEvents || featuredEvents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay eventos destacados agregados aún.
                </p>
              ) : (
                <div className="space-y-4">
                  {featuredEvents.map((event) => (
                    <Card key={event.id} className="overflow-hidden">
                      <div className="flex flex-col sm:flex-row">
                        <div className="relative w-full sm:w-48 h-32 flex-shrink-0">
                          <Image
                            src={event.image}
                            alt={event.title}
                            fill
                            className="object-cover"
                            unoptimized={event.image.startsWith('data:')}
                          />
                        </div>
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold mb-1">{event.title}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                {event.description}
                              </p>
                              <div className="flex gap-2">
                                {event.badge1 && <Badge variant="secondary">{event.badge1}</Badge>}
                                {event.badge2 && <Badge variant="outline">{event.badge2}</Badge>}
                              </div>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteEvent(event.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ContentManagementPage() {
  return (
    <AdminAuthGuard>
      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset>
          {/* Mobile Header */}
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:hidden">
            <SidebarTrigger className="h-10 w-10 -ml-2" />
            <h1 className="text-lg font-semibold">Contenido Principal</h1>
          </header>
          
          <ContentManagementContent />
        </SidebarInset>
      </SidebarProvider>
    </AdminAuthGuard>
  );
}
