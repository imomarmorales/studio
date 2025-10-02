import Image from "next/image";
import { Download } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/shared/Logo";
import { PlaceHolderImages } from "@/lib/placeholder-images";

interface DigitalCredentialProps {
  user: {
    name: string;
    email: string;
  };
}

export function DigitalCredential({ user }: DigitalCredentialProps) {
  const qrCodeImage = PlaceHolderImages.find(p => p.id === "qr-code-placeholder");

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/30">
        <CardTitle>Credencial Digital</CardTitle>
      </CardHeader>
      <CardContent className="p-6 text-center">
        <div className="mb-4">
          <Logo />
        </div>
        
        {qrCodeImage && (
            <div className="flex justify-center my-6">
                <Image
                    src={qrCodeImage.imageUrl}
                    alt={qrCodeImage.description}
                    width={200}
                    height={200}
                    className="rounded-lg shadow-md"
                    data-ai-hint={qrCodeImage.imageHint}
                />
            </div>
        )}

        <h3 className="text-xl font-semibold font-headline">{user.name}</h3>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        
        <Separator className="my-6" />

        <p className="text-xs text-muted-foreground">
            Este código QR es tu identificación personal para el congreso.
            Úsalo para registrar tu asistencia y acceder a los eventos.
        </p>

      </CardContent>
      <CardFooter>
        <Button className="w-full">
          <Download className="mr-2 h-4 w-4" />
          Descargar Credencial
        </Button>
      </CardFooter>
    </Card>
  );
}
