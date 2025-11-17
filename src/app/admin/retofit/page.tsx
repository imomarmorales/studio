'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { RetoFitFlyer } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Upload, Trash2, Eye, EyeOff, ChevronUp, ChevronDown, Image as ImageIcon } from 'lucide-react';
import { convertImageToBase64, compressImageIfNeeded, validateImageFile } from '@/lib/upload-image';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { AdminHeader } from '@/components/layout/AdminHeader';

const formSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres.'),
  link: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
  active: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

function AdminRetoFitContent() {
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingFlyer, setEditingFlyer] = useState<RetoFitFlyer | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      link: '',
      active: true,
    },
  });

  const forceRefresh = () => setRefreshKey(k => k + 1);

  const flyersQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'retofit_flyers'), orderBy('order', 'asc')) : null,
    [firestore, refreshKey]
  );
  const { data: flyers, isLoading } = useCollection<RetoFitFlyer>(flyersQuery);

  useEffect(() => {
    if (editingFlyer) {
      form.reset({
        title: editingFlyer.title,
        link: editingFlyer.link || '',
        active: editingFlyer.active,
      });
      setImagePreview(editingFlyer.image);
    }
  }, [editingFlyer, form]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const validation = validateImageFile(file);
      if (!validation.valid && validation.error) {
        throw new Error(validation.error);
      }
      const compressedFile = await compressImageIfNeeded(file);
      const base64 = await convertImageToBase64(compressedFile);
      
      setImageFile(compressedFile);
      setImagePreview(base64);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error con la imagen',
        description: error.message,
      });
    }
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (!firestore) return;
    if (!imagePreview && !editingFlyer) {
      toast({
        variant: 'destructive',
        title: 'Imagen requerida',
        description: 'Por favor selecciona una imagen para el flyer.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const flyerData = {
        title: data.title,
        description: '', // No usamos descripción
        link: data.link || '',
        active: data.active,
        image: imagePreview || editingFlyer?.image || '',
        order: editingFlyer?.order ?? (flyers?.length || 0),
      };

      if (editingFlyer) {
        const flyerRef = doc(firestore, 'retofit_flyers', editingFlyer.id);
        await updateDoc(flyerRef, flyerData);
        toast({
          title: 'Flyer actualizado',
          description: 'El flyer se ha actualizado correctamente.',
        });
      } else {
        await addDoc(collection(firestore, 'retofit_flyers'), flyerData);
        toast({
          title: 'Flyer creado',
          description: 'El flyer se ha creado correctamente.',
        });
      }

      form.reset({ title: '', link: '', active: true });
      setImageFile(null);
      setImagePreview(null);
      setEditingFlyer(null);
      forceRefresh();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    if (!confirm('¿Estás seguro de eliminar este flyer?')) return;

    try {
      await deleteDoc(doc(firestore, 'retofit_flyers', id));
      toast({
        title: 'Flyer eliminado',
        description: 'El flyer se ha eliminado correctamente.',
      });
      forceRefresh();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  const handleToggleActive = async (flyer: RetoFitFlyer) => {
    if (!firestore) return;
    try {
      const flyerRef = doc(firestore, 'retofit_flyers', flyer.id);
      await updateDoc(flyerRef, { active: !flyer.active });
      toast({
        title: flyer.active ? 'Flyer ocultado' : 'Flyer activado',
        description: `El flyer ahora está ${!flyer.active ? 'visible' : 'oculto'}.`,
      });
      forceRefresh();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  const moveFlyer = async (flyer: RetoFitFlyer, direction: 'up' | 'down') => {
    if (!firestore || !flyers) return;
    const currentIndex = flyers.findIndex(f => f.id === flyer.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= flyers.length) return;

    try {
      const flyerRef = doc(firestore, 'retofit_flyers', flyer.id);
      const targetFlyerRef = doc(firestore, 'retofit_flyers', flyers[targetIndex].id);

      await updateDoc(flyerRef, { order: flyers[targetIndex].order });
      await updateDoc(targetFlyerRef, { order: flyer.order });

      toast({
        title: 'Orden actualizado',
        description: 'El orden de los flyers se ha actualizado.',
      });
      forceRefresh();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  return (
    <div className="space-y-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>{editingFlyer ? 'Editar Flyer' : 'Crear Nuevo Flyer'}</CardTitle>
            <CardDescription>
              {editingFlyer ? 'Modifica la información del flyer' : 'Agrega un nuevo flyer para #RetoFIT'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Image Upload */}
                  <div className="space-y-2">
                    <FormLabel>Imagen del Flyer</FormLabel>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      {imagePreview ? (
                        <div className="space-y-2">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="mx-auto max-h-48 rounded-md object-contain"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview(null);
                            }}
                          >
                            Cambiar Imagen
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Selecciona una imagen (máx. 500KB)
                          </p>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Inscríbete a la Carrera 5K" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="link"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Link (Opcional)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://..." {...field} />
                          </FormControl>
                          <FormDescription>
                            Link externo para más información
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Visible</FormLabel>
                            <FormDescription>
                              Mostrar este flyer en la página de RetoFIT
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingFlyer ? 'Actualizar' : 'Crear'} Flyer
                  </Button>
                  {editingFlyer && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingFlyer(null);
                        form.reset();
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Flyers List */}
        <Card>
          <CardHeader>
            <CardTitle>Flyers Existentes</CardTitle>
            <CardDescription>
              {flyers?.length || 0} flyer(s) registrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            )}

            {!isLoading && (!flyers || flyers.length === 0) && (
              <p className="text-center text-muted-foreground py-8">
                No hay flyers registrados. Crea el primero arriba.
              </p>
            )}

            {!isLoading && flyers && flyers.length > 0 && (
              <div className="space-y-4">
                {flyers.map((flyer, index) => (
                  <Card key={flyer.id} className={!flyer.active ? 'opacity-50' : ''}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Image */}
                        <img
                          src={flyer.image}
                          alt={flyer.title}
                          className="w-32 h-32 object-cover rounded-md flex-shrink-0"
                        />

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-lg">{flyer.title}</h3>
                              {flyer.link && (
                                <a
                                  href={flyer.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  {flyer.link}
                                </a>
                              )}
                            </div>
                            <Badge variant="outline" className="h-fit">
                              #{index + 1}
                            </Badge>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingFlyer(flyer)}
                            >
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleActive(flyer)}
                            >
                              {flyer.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => moveFlyer(flyer, 'up')}
                              disabled={index === 0}
                            >
                              <ChevronUp className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => moveFlyer(flyer, 'down')}
                              disabled={index === flyers.length - 1}
                            >
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(flyer.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}

export default function AdminRetoFitPage() {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <AdminHeader />
        <div className="p-4 sm:p-6 lg:p-8">
            <AdminRetoFitContent />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
