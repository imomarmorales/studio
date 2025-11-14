'use client';

import { PlusCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface EmptyStateProps {
  onCreateEvent?: () => void;
}

export function EmptyState({ onCreateEvent }: EmptyStateProps) {
  return (
    <Card className="border-2 border-dashed border-muted-foreground/25 bg-muted/5">
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="rounded-full bg-primary/10 p-6 mb-6">
          <Calendar className="h-12 w-12 text-primary" />
        </div>
        
        <h3 className="text-2xl font-semibold tracking-tight mb-2">
          Aún no has creado ningún evento
        </h3>
        
        <p className="text-muted-foreground max-w-sm mb-8">
          Crea tu primer evento para que los participantes puedan registrar su asistencia 
          y comenzar a acumular puntos.
        </p>
        
        {onCreateEvent && (
          <Button onClick={onCreateEvent} size="lg" className="gap-2">
            <PlusCircle className="h-5 w-5" />
            Crear Primer Evento
          </Button>
        )}
      </div>
    </Card>
  );
}
