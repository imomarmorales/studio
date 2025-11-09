'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  if (isUserLoading || !user) {
    return (
      <div className="space-y-8">
        <PageHeader title="Dashboard" description="Bienvenido a tu panel de control." />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" description={`Bienvenido, ${user.displayName || 'participante'}.`} />
      <Card>
        <CardHeader>
          <CardTitle>Mi Progreso</CardTitle>
          <CardDescription>Aquí verás los eventos a los que has asistido y tus puntos.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Contenido próximamente.</p>
        </CardContent>
      </Card>
    </div>
  );
}
