'use client';

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useCollection, useFirebase, useMemoFirebase, useUser } from "@/firebase";
import { collection, doc, CollectionReference, Query, query, where, getDocs } from "firebase/firestore";
import { Calendar, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import type { CongressEvent } from "@/lib/types";
import { QrScannerDialog } from "@/components/events/QrScannerDialog";
import { EventDetailsDialog }from "@/components/events/EventDetailsDialog";
import { markAttendance } from "@/lib/events";
import { useToast } from "@/hooks/use-toast";


const exampleEvents: CongressEvent[] = [
  {
    id: 'evento-1',
    title: 'Conferencia Inaugural: IA en la Ingeniería',
    description: 'El Dr. Alan Turing explorará el impacto de la inteligencia artificial en las disciplinas de la ingeniería moderna.',
    dateTime: '2025-11-18T09:00:00',
    location: 'Auditorio Principal',
    imageUrl: 'https://picsum.photos/seed/evento-1/600/400'
  },
  {
    id: 'evento-2',
    title: 'Taller: Desarrollo de Apps con React y Firebase',
    description: 'Un taller práctico donde aprenderás a construir aplicaciones web modernas utilizando las tecnologías más demandadas.',
    dateTime: '2025-11-18T11:00:00',
    location: 'Laboratorio de Cómputo 1',
    imageUrl: 'https://picsum.photos/seed/evento-2/600/400'
  },
  {
    id: 'evento-3',
    title: 'Ponencia: La Revolución del IoT',
    description: 'Descubre cómo el Internet de las Cosas está transformando la industria y la vida cotidiana.',
    dateTime: '2025-11-19T10:00:00',
    location: 'Auditorio B',
    imageUrl: 'https://picsum.photos/seed/evento-3/600/400'
  },
  {
    id: 'evento-4',
    title: 'Concurso de Programación #CodingChallenge',
    description: 'Demuestra tus habilidades de programación y compite por increíbles premios. ¡Inscripciones abiertas!',
    dateTime: '2025-11-19T14:00:00',
    location: 'Sala de Usos Múltiples',
    imageUrl: 'https://picsum.photos/seed/evento-4/600/400'
  },
  {
    id: 'evento-5',
    title: 'Mesa Redonda: El Futuro de las Energías Renovables',
    description: 'Un panel de expertos discutirá los avances y desafíos de las energías limpias en México y el mundo.',
    dateTime: '2025-11-20T12:00:00',
    location: 'Auditorio Principal',
    imageUrl: 'https://picsum.photos/seed/evento-5/600/400'
  }
];


export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const [selectedEventForDetails, setSelectedEventForDetails] = useState<CongressEvent | null>(null);
  const [isScannerOpen, setScannerOpen] = useState(false);
  const [lastScannedEventId, setLastScannedEventId] = useState<string | null>(null);

  // Use hardcoded events for now
  const events = exampleEvents;
  const areEventsLoading = false;

  /*
  const eventsQuery = useMemoFirebase(() => {
      if (!firestore) return null;
      return collection(firestore, 'congressEvents') as Query<CongressEvent>;
  }, [firestore]);

  const { data: events, isLoading: areEventsLoading } = useCollection<CongressEvent>(eventsQuery);
  */

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);


  const handleScanSuccess = async (eventId: string) => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión para marcar asistencia.' });
      return;
    }
    
    // Prevent re-scanning the same code immediately
    if(eventId === lastScannedEventId) return;

    setLastScannedEventId(eventId);
    setScannerOpen(false);

    try {
      await markAttendance(firestore, user.uid, eventId);
      toast({ title: '¡Asistencia Registrada!', description: 'Has ganado puntos por participar en el evento.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al Registrar Asistencia', description: error.message });
    }
    
    // Allow re-scanning after a delay
    setTimeout(() => setLastScannedEventId(null), 2000);
  };


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
                  src={event.imageUrl || `https://picsum.photos/seed/${event.id}/600/400`} 
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
                <CardFooter className="p-0 pt-6 flex items-center gap-2">
                  <Button className="w-full" variant="outline" onClick={() => setSelectedEventForDetails(event)}>Ver Detalles</Button>
                  <Button className="w-full" onClick={() => setScannerOpen(true)}>Marcar Asistencia</Button>
                </CardFooter>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog for Event Details */}
      <EventDetailsDialog 
        event={selectedEventForDetails} 
        isOpen={!!selectedEventForDetails}
        onOpenChange={(isOpen) => !isOpen && setSelectedEventForDetails(null)}
        onMarkAttendanceClick={() => {
            if (selectedEventForDetails) {
                setScannerOpen(true);
                // We keep the details dialog open in case the user wants to see it again.
                // but if we want to close it, we should do:
                // setSelectedEventForDetails(null);
            }
        }}
      />

      {/* Dialog for QR Scanner */}
      <QrScannerDialog 
        isOpen={isScannerOpen}
        onOpenChange={setScannerOpen}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
}
