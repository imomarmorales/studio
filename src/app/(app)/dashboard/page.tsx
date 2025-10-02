import { DigitalCredential } from "@/components/dashboard/DigitalCredential";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, CheckCircle, Star } from "lucide-react";

export default function DashboardPage() {
  const user = {
    name: "Juan Pérez",
    email: "jperez@uat.edu.mx",
    points: 125,
    rank: 15,
    attendance: 8,
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={`¡Bienvenido, ${user.name}!`}
        description="Aquí está un resumen de tu actividad en el congreso."
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Puntos</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.points}</div>
            <p className="text-xs text-muted-foreground">Ranking: #{user.rank}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asistencia</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.attendance} eventos</div>
            <p className="text-xs text-muted-foreground">80% de asistencia total</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <DigitalCredential user={user} />
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Próximos Eventos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Aquí se mostrará una lista de tus próximos eventos agendados.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
