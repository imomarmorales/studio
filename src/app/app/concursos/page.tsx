import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ConcursosPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Concursos"
        description="Demuestra tus habilidades y compite por grandes premios."
      />
      <Card>
        <CardHeader>
          <CardTitle>Información de Concursos</CardTitle>
          <CardDescription>Próximamente</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Aquí se mostrará la información de los concursos disponibles, como programación, innovación, y robótica, junto con sus reglas, premios y horarios.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
