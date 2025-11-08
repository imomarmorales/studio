'use client';

import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { seedEvents } from '@/lib/admin-actions';
import { useFirebase } from '@/firebase';


export default function ManageEventsPage() {
    const { toast } = useToast();
    const { firestore } = useFirebase();

    const handleSeedEvents = async () => {
        if (!firestore) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "La base de datos no está disponible. Inténtalo de nuevo.",
            });
            return;
        }

        try {
            await seedEvents(firestore);
            toast({
                title: "Éxito",
                description: "Los eventos de ejemplo han sido cargados correctamente.",
            });
        } catch (error: any) {
            console.error("Error seeding events:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "No se pudieron cargar los eventos de ejemplo.",
            });
        }
    };


  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestionar Eventos"
        description="Crear, editar y administrar los eventos del congreso."
      />
      <Card>
        <CardHeader>
          <CardTitle>Cargar Datos de Ejemplo</CardTitle>
          <CardDescription>
            Usa este botón para poblar la base de datos con eventos de
            ejemplo y probar la funcionalidad de la aplicación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSeedEvents}>Cargar Eventos de Ejemplo</Button>
        </CardContent>
      </Card>
    </div>
  );
}
