'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

interface FeaturedEvent {
  id: string;
  title: string;
  description: string;
  image: string;
  badge1?: string;
  badge2?: string;
  order: number;
}

export function FeaturedEvents() {
  const [events, setEvents] = useState<FeaturedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Obtener eventos destacados de Firestore
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Inicializar Firebase si no está inicializado
        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
        const firestore = getFirestore(app);
        
        // Obtener eventos destacados de Firestore (máximo 3)
        const eventsQuery = query(
          collection(firestore, 'featuredEvents'),
          orderBy('order', 'asc'),
          limit(3)
        );
        const snapshot = await getDocs(eventsQuery);
        const eventsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as FeaturedEvent[];
        
        setEvents(eventsData);
      } catch (error: any) {
        // Silenciar error de permisos - simplemente no mostrar eventos
        console.log('No se pudieron cargar eventos destacados:', error.code);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // No mostrar nada si está cargando o no hay eventos
  if (loading || events.length === 0) {
    return null;
  }

  return (
    <div className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Eventos Destacados
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Explora nuestra selección de eventos principales del congreso
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event) => (
            <div
              key={event.id}
              className="group relative rounded-2xl overflow-hidden bg-card border hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
            >
              {/* Image */}
              <div className="relative h-64 overflow-hidden">
                <Image
                  src={event.image}
                  alt={event.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  unoptimized={event.image.startsWith('data:')}
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                
                {/* Badges */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  {event.badge1 && (
                    <Badge className="bg-primary text-primary-foreground">
                      {event.badge1}
                    </Badge>
                  )}
                  {event.badge2 && (
                    <Badge variant="secondary" className="bg-background/90">
                      {event.badge2}
                    </Badge>
                  )}
                </div>

                {/* Title on image */}
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {event.title}
                  </h3>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-muted-foreground mb-6 line-clamp-3">
                  {event.description}
                </p>

                <Link href="/registro">
                  <Button className="w-full" size="lg">
                    Más Información
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
