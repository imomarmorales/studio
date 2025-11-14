'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
  // Default featured events (shows always on public page)
  const defaultEvents: FeaturedEvent[] = [
    {
      id: '1',
      title: 'Conferencia Inteligencia Artificial',
      description: 'Descubre las últimas tendencias en IA y Machine Learning. Expertos de la industria compartirán sus conocimientos sobre el futuro de la tecnología.',
      image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop',
      badge1: 'Top Rated',
      badge2: '5 Day Event',
      order: 1,
    },
    {
      id: '2',
      title: 'Workshop Desarrollo Web Moderno',
      description: 'Aprende las mejores prácticas en desarrollo web con React, Next.js y TypeScript. Sesiones prácticas con proyectos reales.',
      image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop',
      badge1: 'Hands-on',
      badge2: '3 Days',
      order: 2,
    },
    {
      id: '3',
      title: 'Hackathon de Innovación',
      description: 'Participa en nuestro hackathon anual donde podrás crear soluciones innovadoras y competir por increíbles premios.',
      image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=600&fit=crop',
      badge1: 'Competition',
      badge2: '24 Hours',
      order: 3,
    },
  ];

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
          {defaultEvents.map((event) => (
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
