import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function PerfilPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Mi Perfil"
        description="Gestiona tu información y certificados."
      />
      <div className="space-y-6">
        <Card>
            <CardHeader><CardTitle>Mis Certificados</CardTitle></CardHeader>
            <CardContent>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                        <p className="font-semibold">Certificado de Asistencia al Congreso</p>
                        <p className="text-sm text-muted-foreground">Generado por completar 80% de asistencia.</p>
                    </div>
                    <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Descargar</Button>
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>Mi Asistencia</CardTitle></CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Aquí se mostrará un desglose de los eventos a los que has asistido.</p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
