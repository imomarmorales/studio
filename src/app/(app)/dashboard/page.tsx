'use client';

import { DigitalCredential } from "@/components/dashboard/DigitalCredential";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDoc, useFirebase, useMemoFirebase, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import { Award, CheckCircle, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  const isLoading = isUserLoading || isUserDataLoading;

  if (isLoading || !userData) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="¡Bienvenido!"
          description="Aquí está un resumen de tu actividad en el congreso."
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Puntos</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Asistencia</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
                <Skeleton className="h-[450px] w-full rounded-lg"/>
            </div>
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                    <CardTitle>Próximos Eventos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-5 w-full"/>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-8">
      <PageHeader
        title={`¡Bienvenido, ${userData.name}!`}
        description="Aquí está un resumen de tu actividad en el congreso."
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Puntos</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userData.points || 0}</div>
            <p className="text-xs text-muted-foreground">Ranking: #1</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asistencia</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0 eventos</div>
            <p className="text-xs text-muted-foreground">0% de asistencia total</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <DigitalCredential user={userData} />
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
