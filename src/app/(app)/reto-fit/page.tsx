import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function RetoFitPage() {
    const adidasQrImage = PlaceHolderImages.find(p => p.id === "adidas-running-qr");

  return (
    <div className="space-y-8">
      <PageHeader
        title="#RetoFIT Carrera 5K"
        description="¡Participa en nuestro evento deportivo!"
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Información del Evento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p><span className="font-semibold">Fecha:</span> Sábado 23 de Agosto, 2025</p>
                <p><span className="font-semibold">Hora:</span> 7:00 AM</p>
                <p><span className="font-semibold">Distancia:</span> 5 Kilómetros</p>
                <p><span className="font-semibold">Punto de partida:</span> Pista de Atletismo de la UAT</p>
                <p className="text-muted-foreground">Más instrucciones serán enviadas por correo a los participantes registrados.</p>
                <Button>Registrarme a la Carrera</Button>
            </CardContent>
        </Card>
        <Card className="text-center">
            <CardHeader>
                <CardTitle>Sigue el Reto</CardTitle>
                <CardDescription>Escanea para unirte al evento en Adidas Running.</CardDescription>
            </CardHeader>
            <CardContent>
                {adidasQrImage && (
                    <Image
                        src={adidasQrImage.imageUrl}
                        alt={adidasQrImage.description}
                        width={200}
                        height={200}
                        className="mx-auto rounded-lg"
                        data-ai-hint={adidasQrImage.imageHint}
                    />
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
