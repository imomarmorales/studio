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
import { useUser, useFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { Upload } from "lucide-react";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { DigitalCredential } from "@/components/dashboard/DigitalCredential";
import { useEffect } from "react";
import { useRouter } from "next/navigation";


export default function PerfilPage() {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();


  // Redirect if not logged in
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);


  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !firestore) return;

    const formData = new FormData(event.currentTarget);
    const newName = formData.get("name") as string;

    const userDocRef = doc(firestore, "users", user.uid);
    setDocumentNonBlocking(userDocRef, { name: newName }, { merge: true });

    toast({
      title: "Perfil Actualizado",
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
            <div className="grid gap-8 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Editar Información</CardTitle>
                        <CardDescription>Actualiza tus datos personales.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-10 w-24" />
                    </CardContent>
                </Card>
                <div className="space-y-6">
                   <Skeleton className="h-96 w-full" />
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
      <div className="grid gap-8 md:grid-cols-3">
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
                    <Image src={user.photoURL || `https://picsum.photos/seed/${user.uid}/200`} alt="Avatar" width={64} height={64} className="rounded-full" />
                    <Button type="button" variant="outline" asChild>
                        <label htmlFor="avatar-upload" className="cursor-pointer">
                            <Upload className="mr-2 h-4 w-4" />
                            Subir Nueva Foto
                        </label>
                    </Button>
                    <input id="avatar-upload" type="file" className="sr-only" accept="image/*" />
                </div>
                <p className="text-xs text-muted-foreground">La funcionalidad de subir foto se implementará próximamente.</p>
              </div>

              <Button type="submit">Guardar Cambios</Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
            <DigitalCredential user={{ name: user.displayName || 'Usuario', email: user.email || '', digitalCredentialQR: user.uid }} />
        </div>
      </div>
    </div>
  );
}
