import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ColoquioPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Coloquio de Investigación"
        description="Conoce los proyectos de investigación más recientes."
      />
      <Card>
        <CardHeader>
          <CardTitle>Proyectos Presentados</CardTitle>
          <CardDescription>Próximamente</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Aquí se mostrará la lista de investigaciones presentadas, sus autores y resúmenes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
