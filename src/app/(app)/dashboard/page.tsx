'use client';

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useCollection, useFirebase, useMemoFirebase, useUser } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { Calendar, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

// Mock data for events, to be replaced with Firestore data
const mockEvents = [
  { id: '1', title: 'Ponencia: IA en la Industria 4.0', description: 'Explorando el futuro de la inteligencia artificial.', dateTime: '2025-11-18T10:00:00', location: 'Auditorio Principal', imageUrl: 'https://picsum.photos/seed/event1/600/400' },
  { id: '2', title: 'Taller de Robótica Móvil', description: 'Construye y programa tu propio robot seguidor de línea.', dateTime: '2025-11-19T15:00:00', location: 'Laboratorio de Electrónica', imageUrl: 'https://picsum.photos/seed/event2/600/400' },
  { id: '3', title: 'Concurso de Programación', description: 'Resuelve problemas complejos y compite por el primer lugar.', dateTime: '2025-11-20T09:00:00', location: 'Centro de Cómputo', imageUrl: 'https://picsum.photos/seed/event3/600/400' },
];

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  // For this example, we'll use mock events. In a real scenario, you'd fetch from Firestore.
  const { data: events, isLoading: areEventsLoading } = { data: mockEvents, isLoading: false };
  
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  const isLoading = isUserLoading || areEventsLoading;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Eventos Disponibles"
        description="Explora y participa en las actividades del congreso."
      />

      {isLoading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
               <Skeleton className="h-48 w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
              <CardFooter>
                 <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events?.map((event) => (
            <Card key={event.id} className="flex flex-col overflow-hidden">
              <div className="relative w-full h-48">
                <Image 
                  src={event.imageUrl} 
                  alt={`Imagen de ${event.title}`} 
                  fill
                  className="object-cover"
                  data-ai-hint="event concert"
                />
              </div>
              <div className="flex flex-col flex-grow p-6">
                <CardHeader className="p-0 mb-4">
                  <CardTitle>{event.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-grow space-y-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>{new Date(event.dateTime).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="mr-2 h-4 w-4" />
                    <span>{event.location}</span>
                  </div>
                </CardContent>
                <CardFooter className="p-0 pt-6">
                  <Button className="w-full">Ver Detalles</Button>
                </CardFooter>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
