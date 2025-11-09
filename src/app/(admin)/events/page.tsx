'use client';

import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ManageEventsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestionar Eventos"
        description="Crear, editar y administrar los eventos del congreso."
      />
      <Card>
        <CardHeader>
          <CardTitle>Página de Configuración de Administrador</CardTitle>
          <CardDescription>
            Bienvenido al panel de administración.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Aquí podrás configurar los eventos y gestionar usuarios.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
