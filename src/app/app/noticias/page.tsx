import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";

export default function NoticiasPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Noticias y Avisos"
        description="Mantente al día con las últimas novedades del congreso."
      />
      <Card>
        <CardHeader>
          <CardTitle>Aviso Importante</CardTitle>
          <CardDescription>15 de Julio, 2025</CardDescription>
        </CardHeader>
        <CardContent className="flex items-start gap-4">
            <Bell className="h-5 w-5 text-primary mt-1" />
            <div>
                <p className="font-semibold">Cambio de Horario en Taller de Robótica</p>
                <p className="text-muted-foreground">El taller de robótica ha sido reprogramado para las 16:00 hrs. en el mismo laboratorio.</p>
            </div>
        </CardContent>
      </Card>
       <Card>
        <CardHeader>
          <CardTitle>Recordatorio</CardTitle>
          <CardDescription>14 de Julio, 2025</CardDescription>
        </CardHeader>
        <CardContent className="flex items-start gap-4">
            <Bell className="h-5 w-5 text-primary mt-1" />
            <div>
                <p className="font-semibold">Inscripciones a #RetoFIT</p>
                <p className="text-muted-foreground">No olvides registrarte para la carrera #RetoFIT. ¡Los lugares son limitados!</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
