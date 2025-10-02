"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { QrCode, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { PublicLayout } from "@/components/layout/PublicLayout";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleQrUpload = () => {
    // This would open a file dialog to upload the QR image
    // Then process it and log the user in.
    toast({
      title: "Credencial Verificada",
      description: "Iniciando sesión...",
    });
    // Simulate successful login
    setTimeout(() => {
      router.push("/dashboard");
    }, 2000);
  };

  const handleForgotPassword = () => {
    // This would trigger a flow to resend the QR code
    toast({
      title: "Solicitud Enviada",
      description: "Si tu correo está registrado, recibirás tu credencial en breve.",
    });
  };

  return (
    <PublicLayout>
      <div className="container flex items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="font-headline text-2xl">Iniciar Sesión</CardTitle>
            <CardDescription>
              Escanea o carga tu credencial digital para acceder.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-6 p-8">
            <div className="p-6 border-2 border-dashed rounded-lg">
                <QrCode className="h-32 w-32 text-muted-foreground" />
            </div>
            <Button className="w-full" onClick={handleQrUpload}>
              <Upload className="mr-2 h-4 w-4" /> Cargar Credencial (QR)
            </Button>
            <p className="text-sm text-muted-foreground">o usa la cámara de tu dispositivo</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button variant="link" onClick={handleForgotPassword}>¿Perdiste tu credencial?</Button>
          </CardFooter>
        </Card>
      </div>
    </PublicLayout>
  );
}
