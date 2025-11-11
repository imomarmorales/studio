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
import { useUser, useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, orderBy, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Upload, Trophy, Calendar, Award, CheckCircle2, Loader2 } from "lucide-react";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { DigitalCredential } from "@/components/dashboard/DigitalCredential";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Attendance, CongressEvent, Participant } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserBadges } from "@/components/profile/UserBadges";


export default function PerfilPage() {
  const { user, isUserLoading } = useUser();
  const { firestore, storage } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

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
    () => (firestore ? query(collection(firestore, 'users'), orderBy('points', 'desc')) : null),
    [firestore]
  );
  const { data: allUsers } = useCollection<Participant>(usersQuery);

  // Query all events to get event details for attendance history
  const eventsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'events')) : null),
    [firestore]
  );
  const { data: events } = useCollection<CongressEvent>(eventsQuery);

  // Calculate user's ranking position
  const rankedUsers = allUsers?.filter(u => (u.points || 0) > 0) || [];
  const userPosition = user ? rankedUsers.findIndex(u => u.id === user.uid) + 1 : -1;
  const userStats = allUsers?.find(u => u.id === user?.uid);

  // Get event details for each attendance
  const attendanceWithEvents = attendances?.map(attendance => {
    const event = events?.find(e => e.id === attendance.eventId);
    return { ...attendance, event };
  }) || [];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Archivo Inválido',
        description: 'Por favor selecciona una imagen válida.',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'Archivo Muy Grande',
        description: 'La imagen debe ser menor a 5MB.',
      });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadPhoto = async () => {
    if (!selectedFile || !user || !storage || !firestore) return;

    setIsUploading(true);
    try {
      // Upload to Firebase Storage
      const storageRef = ref(storage, `profile_photos/${user.uid}/${Date.now()}_${selectedFile.name}`);
      await uploadBytes(storageRef, selectedFile);
      const downloadUrl = await getDownloadURL(storageRef);

      // Update user document
      const userDocRef = doc(firestore, 'users', user.uid);
      await setDocumentNonBlocking(userDocRef, { photoURL: downloadUrl }, { merge: true });

      toast({
        title: '✅ Foto Actualizada',
        description: 'Tu foto de perfil se ha actualizado correctamente.',
      });

      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast({
        variant: 'destructive',
        title: 'Error al Subir Foto',
        description: error.message || 'No se pudo subir la imagen.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !firestore) return;

    const formData = new FormData(event.currentTarget);
    const newName = formData.get("name") as string;

    const userDocRef = doc(firestore, "users", user.uid);
    setDocumentNonBlocking(userDocRef, { name: newName }, { merge: true });

    toast({
      title: "✅ Perfil Actualizado",
      description: "Tu nombre ha sido actualizado correctamente.",
    });
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
            <div className="text-2xl font-bold">{(userStats?.points || 0).toLocaleString()}</div>
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
            <div className="text-2xl font-bold">{userStats?.attendanceCount || 0}</div>
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
            <div className="text-2xl font-bold">{userStats?.badges?.length || 0}</div>
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
                <Input id="name" name="name" defaultValue={user.displayName || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input id="email" type="email" value={user.email || ''} disabled />
              </div>
               <div className="space-y-2">
                <Label htmlFor="avatar">Foto de Perfil</Label>
                <div className="flex items-center gap-4">
                    <Avatar className="w-20 h-20 border-4 border-primary">
                      <AvatarImage src={previewUrl || user.photoURL || undefined} alt="Avatar" />
                      <AvatarFallback className="text-2xl font-bold">
                        {user.displayName?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-2">
                      <Button type="button" variant="outline" size="sm" asChild>
                          <label htmlFor="avatar-upload" className="cursor-pointer">
                              <Upload className="mr-2 h-4 w-4" />
                              Seleccionar Foto
                          </label>
                      </Button>
                      {selectedFile && (
                        <Button 
                          type="button" 
                          size="sm" 
                          onClick={handleUploadPhoto}
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Subiendo...
                            </>
                          ) : (
                            'Guardar Foto'
                          )}
                        </Button>
                      )}
                      <input 
                        id="avatar-upload" 
                        type="file" 
                        className="sr-only" 
                        accept="image/*"
                        onChange={handleFileSelect}
                      />
                    </div>
                </div>
                <p className="text-xs text-muted-foreground">JPG, PNG o GIF. Máximo 5MB.</p>
              </div>

              <Button type="submit">Guardar Cambios</Button>
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
            badges={userStats?.badges} 
            attendanceCount={userStats?.attendanceCount || 0}
          />
        </CardContent>
      </Card>
    </div>
  );
}
