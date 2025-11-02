'use client';

import { PageHeader } from '@/components/shared/PageHeader';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function RankingPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Ranking de Participantes"
        description="¡Acumula puntos y gana premios!"
      />
      <Card>
        <CardHeader>
          <CardTitle>Ranking Temporalmente Deshabilitado</CardTitle>
          <CardDescription>
            Esta sección volverá a estar disponible pronto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Estamos realizando ajustes para mejorar la experiencia. ¡Vuelve a
            consultar más tarde para ver tu posición en el ranking!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
