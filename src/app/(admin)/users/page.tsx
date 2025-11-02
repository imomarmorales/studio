'use client';

import { PageHeader } from '@/components/shared/PageHeader';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function ManageUsersPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestionar Usuarios"
        description="Ver y administrar todos los participantes registrados."
      />
      <Card>
        <CardHeader>
          <CardTitle>Página en Construcción</CardTitle>
          <CardDescription>
            Esta sección se encuentra temporalmente deshabilitada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Estamos trabajando para resolver un problema con los permisos de
            datos. Agradecemos tu paciencia.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
