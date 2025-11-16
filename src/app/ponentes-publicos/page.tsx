'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, getFirestore } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import { Speaker } from '@/lib/types';
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { PublicLayout } from "@/components/layout/PublicLayout";

function SpeakerCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col md:flex-row gap-6 p-6">
        <Skeleton className="w-32 h-32 rounded-full flex-shrink-0 mx-auto md:mx-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </Card>
  );
}

export default function PonentesPublicosPage() {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpeakers = async () => {
      try {
        // Initialize Firebase if needed
        if (!getApps().length) {
          initializeApp(firebaseConfig);
        }

      const db = getFirestore();
      const speakersRef = collection(db, 'speakers');
      const snapshot = await getDocs(speakersRef);
      
      const speakersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Speaker[];

      // Ordenar en el código en vez de Firestore (evita necesidad de índice)
      speakersData.sort((a, b) => (a.order || 0) - (b.order || 0));

      setSpeakers(speakersData);
      } catch (error) {
        console.error('Error fetching speakers:', error);
        // Datos de ejemplo mientras se configuran las reglas de Firebase
        setSpeakers([
          {
            id: '1',
            name: 'Dr. Alan Turing',
            title: 'Doctor en Ciencias de la Computación',
            institution: 'Universidad de Cambridge',
            description: 'Pionero en la ciencia de la computación y la inteligencia artificial. Conocido por sus contribuciones fundamentales a la teoría de la computación y por descifrar códigos durante la Segunda Guerra Mundial.',
            photo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzM0OThkYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjgwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkFUPC90ZXh0Pjwvc3ZnPg==',
            order: 0,
          },
          {
            id: '2',
            name: 'Dra. Ada Lovelace',
            title: 'Matemática y Escritora',
            institution: 'Universidad de Londres',
            description: 'Considerada la primera programadora de la historia. Sus notas sobre la máquina analítica de Charles Babbage incluyen lo que se reconoce como el primer algoritmo destinado a ser procesado por una máquina.',
            photo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2U5MWU2MyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjgwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkFMPC90ZXh0Pjwvc3ZnPg==',
            order: 1,
          },
          {
            id: '3',
            name: 'Dr. Linus Torvalds',
            title: 'Ingeniero de Software',
            institution: 'Universidad de Helsinki',
            description: 'Creador del kernel de Linux y del sistema de control de versiones Git. Sus contribuciones han revolucionado el desarrollo de software de código abierto y la colaboración en proyectos tecnológicos.',
            photo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzRjYWY1MCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjgwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxUPC90ZXh0Pjwvc3ZnPg==',
            order: 2,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchSpeakers();
  }, []);

  // Si no hay ponentes y no está cargando, no mostrar nada
  if (!loading && speakers.length === 0) {
    return null;
  }

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8 md:py-12 space-y-8">
        <PageHeader
          title="Ponentes y Facilitadores"
          description="Conoce a los expertos que nos acompañarán en el congreso."
        />

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <SpeakerCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {speakers.map((speaker) => (
                <Card key={speaker.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row gap-6 p-6">
                    {/* Foto del ponente */}
                    <div className="flex-shrink-0 mx-auto md:mx-0">
                      <div className="relative w-32 h-32 md:w-40 md:h-40">
                        <Image
                          src={speaker.photo}
                          alt={speaker.name}
                          fill
                          className="rounded-full object-cover border-4 border-primary/20"
                          unoptimized
                        />
                      </div>
                    </div>

                    {/* Información del ponente */}
                    <div className="flex-1 space-y-3 text-center md:text-left">
                      <div>
                        <h3 className="text-2xl font-headline font-bold text-primary">
                          {speaker.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {speaker.title}
                        </p>
                        {speaker.institution && (
                          <p className="text-sm text-muted-foreground italic">
                            {speaker.institution}
                          </p>
                        )}
                      </div>
                      <p className="text-sm md:text-base leading-relaxed">
                        {speaker.description}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* CTA Section */}
            <div className="mt-12 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-8 text-center">
              <h3 className="text-2xl font-headline font-bold mb-4">
                ¿Quieres conocer más sobre los ponentes?
              </h3>
              <p className="text-muted-foreground mb-6">
                Regístrate para acceder a toda la información del congreso
              </p>
              <div className="flex gap-4 justify-center">
                <Button asChild size="lg">
                  <Link href="/registro">Registrarse</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/login">Iniciar Sesión</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </PublicLayout>
  );
}
