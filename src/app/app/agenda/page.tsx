import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AgendaPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Agenda del Congreso"
        description="Explora todas las actividades planeadas."
      />
      <Tabs defaultValue="ponencias" className="w-full">
        <TabsList>
          <TabsTrigger value="ponencias">Ponencias</TabsTrigger>
          <TabsTrigger value="talleres">Talleres</TabsTrigger>
          <TabsTrigger value="coloquio">Coloquio</TabsTrigger>
          <TabsTrigger value="concursos">Concursos</TabsTrigger>
        </TabsList>
        <TabsContent value="ponencias">
          <Card>
            <CardHeader>
              <CardTitle>Ponencias</CardTitle>
              <CardDescription>
                Contenido de ponencias próximamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Aquí se mostrará la lista de ponencias con opción de búsqueda y filtro.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="talleres">
          <Card>
            <CardHeader>
              <CardTitle>Talleres</CardTitle>
              <CardDescription>
                Contenido de talleres próximamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Aquí se mostrará la lista de talleres con su descripción, cupo y horario.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="coloquio">
          <Card>
            <CardHeader>
              <CardTitle>Coloquio de Investigación</CardTitle>
               <CardDescription>
                Contenido del coloquio próximamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Aquí se mostrarán las investigaciones presentadas.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="concursos">
          <Card>
            <CardHeader>
              <CardTitle>Concursos</CardTitle>
               <CardDescription>
                Contenido de concursos próximamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Aquí se mostrará la información de los concursos.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
