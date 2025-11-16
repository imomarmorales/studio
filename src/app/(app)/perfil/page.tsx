'use client';

import { PageHeader } from "@/components/shared/PageHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser, useFirebase, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { doc, collection, query, orderBy, where, updateDoc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Upload, Trophy, Calendar, Award, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DigitalCredential } from "@/components/dashboard/DigitalCredential";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Attendance, CongressEvent, Participant } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserBadges } from "@/components/profile/UserBadges";
import { compressImageIfNeeded, convertImageToBase64, validateImageFile } from "@/lib/upload-image";


export default function PerfilPage() {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Redirect if not logged in
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  // Get current user document
  const userDocRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userData } = useDoc<Participant>(userDocRef);

  // Initialize form with user data
  useEffect(() => {
    if (userData) {
      setName(userData.name || '');
      setEmail(userData.email || '');
    }
  }, [userData]);

  // Query user's attendance history
  const attendanceQuery = useMemoFirebase(
    () => (firestore && user ? query(
      collection(firestore, `users/${user.uid}/attendance`),
      orderBy('timestamp', 'desc')
    ) : null),
    [firestore, user]
  );
  const { data: attendances } = useCollection<Attendance>(attendanceQuery);

  // Query all users to calculate ranking position
  const usersQuery = useMemoFirebase(
    () => {
      if (!firestore) return null;
      if (isUserLoading) return null; // Wait for auth to complete
      if (!user) return null; // No user, no query
      return query(collection(firestore, 'users'), orderBy('points', 'desc'));
    },
    [firestore, user, isUserLoading]
  );
  const { data: allUsers } = useCollection<Participant>(usersQuery);

  // Query all events to get event details for attendance history
  const eventsQuery = useMemoFirebase(
    () => {
      if (!firestore) return null;
      if (isUserLoading) return null; // Wait for auth to complete
      if (!user) return null; // No user, no query
      return query(collection(firestore, 'events'));
    },
    [firestore, user, isUserLoading]
  );
  const { data: events } = useCollection<CongressEvent>(eventsQuery);

  // Calculate user's ranking position
  const rankedUsers = allUsers?.filter(u => (u.points || 0) > 0) || [];
  const userPosition = user ? rankedUsers.findIndex(u => u.id === user.uid) + 1 : -1;

  // Get event details for each attendance
  const attendanceWithEvents = attendances?.map(attendance => {
    const event = events?.find(e => e.id === attendance.eventId);
    return { ...attendance, event };
  }) || [];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast({
        variant: 'destructive',
        title: 'Archivo Inválido',
        description: validation.error,
      });
      return;
    }

    setIsUploading(true);
    try {
      // Convert to base64
      const base64 = await convertImageToBase64(file);
      const compressed = await compressImageIfNeeded(base64);

      // Save immediately to Firestore
      if (userDocRef) {
        await updateDoc(userDocRef, { photoURL: compressed });
        
        toast({
          title: '✅ Foto Actualizada',
          description: 'Tu foto de perfil se ha actualizado correctamente.',
        });
      }
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast({
        variant: 'destructive',
        title: 'Error al Subir Foto',
        description: error.message || 'No se pudo subir la imagen.',
      });
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !firestore || !userDocRef) return;

    setIsSaving(true);
    try {
      await updateDoc(userDocRef, { 
        name: name,
        email: email,
      });

      toast({
        title: "✅ Perfil Actualizado",
        description: "Tus cambios se han guardado correctamente.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: 'destructive',
        title: "Error al Guardar",
        description: "No se pudieron guardar los cambios.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isUserLoading || !user) {
    return (
        <div className="space-y-8">
            <PageHeader
                title="Mi Perfil"
                description="Gestiona tu información personal y credencial."
            />
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-10 w-24" />
                    </CardContent>
                </Card>
                <div className="space-y-6">
                   <Skeleton className="h-64 w-full" />
                   <Skeleton className="h-48 w-full" />
                </div>
            </div>
        </div>
    );
  }


  return (
    <div className="space-y-8">
      <PageHeader
        title="Mi Perfil"
        description="Gestiona tu información personal y credencial."
      />

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posición Ranking</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userPosition > 0 ? `#${userPosition}` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              de {rankedUsers.length} participantes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Puntos Totales</CardTitle>
            <Award className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(userData?.points || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              puntos acumulados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Asistidos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userData?.attendanceCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              eventos completados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Insignias</CardTitle>
            <Badge className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userData?.badges?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              logros desbloqueados
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Edit Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Editar Información</CardTitle>
            <CardDescription>Actualiza tus datos personales y foto de perfil.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
               <div className="space-y-2">
                <Label htmlFor="avatar">Foto de Perfil</Label>
                <div className="flex items-center gap-4">
                    <Avatar className="w-20 h-20 border-4 border-primary">
                      <AvatarImage src={userData?.photoURL || undefined} alt="Avatar" />
                      <AvatarFallback className="text-2xl font-bold">
                        {userData?.name?.charAt(0).toUpperCase() || user?.displayName?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-2">
                      <Button type="button" variant="outline" size="sm" asChild disabled={isUploading}>
                          <label htmlFor="avatar-upload" className="cursor-pointer">
                              {isUploading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Subiendo...
                                </>
                              ) : (
                                <>
                                  <Upload className="mr-2 h-4 w-4" />
                                  Seleccionar Foto
                                </>
                              )}
                          </label>
                      </Button>
                      <input 
                        id="avatar-upload" 
                        type="file" 
                        className="sr-only" 
                        accept="image/*"
                        onChange={handleFileSelect}
                        disabled={isUploading}
                      />
                    </div>
                </div>
                <p className="text-xs text-muted-foreground">JPG, PNG o GIF. Máximo 2MB (se comprime automáticamente).</p>
              </div>

              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Digital Credential */}
        <div className="space-y-6">
            <DigitalCredential user={{ name: user.displayName || 'Usuario', email: user.email || '', digitalCredentialQR: user.uid }} />
        </div>
      </div>

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Historial de Asistencias
          </CardTitle>
          <CardDescription>Eventos a los que has asistido</CardDescription>
        </CardHeader>
        <CardContent>
          {attendanceWithEvents && attendanceWithEvents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead className="hidden md:table-cell">Fecha Asistencia</TableHead>
                  <TableHead className="text-right">Puntos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceWithEvents.map((attendance) => (
                  <TableRow key={attendance.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {attendance.event?.title || 'Evento Desconocido'}
                        </p>
                        <p className="text-xs text-muted-foreground md:hidden">
                          {attendance.timestamp?.toDate?.()?.toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {attendance.timestamp?.toDate?.()?.toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                        +{attendance.pointsEarned} pts
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                Aún no has asistido a ningún evento. ¡Escanea códigos QR para empezar a acumular puntos!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Badges Section */}
      <Card>
        <CardContent className="pt-6">
          <UserBadges 
            badges={userData?.badges} 
            attendanceCount={userData?.attendanceCount || 0}
          />
        </CardContent>
      </Card>
    </div>
  );
}
