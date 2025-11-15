'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

interface Sponsor {
  id: string;
  name: string;
  logo: string;
  order: number;
}

export function SponsorsCarousel() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Inicializar Firebase y obtener sponsors
  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        // Inicializar Firebase si no está inicializado
        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
        const firestore = getFirestore(app);
        
        // Obtener sponsors de Firestore
        const sponsorsQuery = query(collection(firestore, 'sponsors'), orderBy('order', 'asc'));
        const snapshot = await getDocs(sponsorsQuery);
        const sponsorsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Sponsor[];
        
        setSponsors(sponsorsData);
      } catch (error: any) {
        // Silenciar error de permisos - simplemente no mostrar sponsors
        console.log('No se pudieron cargar sponsors:', error.code);
      } finally {
        setLoading(false);
      }
    };

    fetchSponsors();
  }, []);

  // Auto-scroll cada 3 segundos si hay sponsors
  useEffect(() => {
    if (sponsors.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = prev + 1;
        if (nextIndex >= sponsors.length) {
          return 0;
        }
        return nextIndex;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [sponsors.length]);

  // No mostrar nada si está cargando o no hay sponsors
  if (loading || sponsors.length === 0) {
    return null;
  }

  // Triplicar para efecto infinito
  const tripleSponsors = [...sponsors, ...sponsors, ...sponsors];

  return (
    <div className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-foreground">
          Nuestros Patrocinadores
        </h2>
        <div className="relative overflow-hidden">
          <div 
            className="flex items-center gap-4 md:gap-8 transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * (100 / sponsors.length)}%)` }}
          >
            {tripleSponsors.map((sponsor, index) => (
              <div
                key={`${sponsor.id}-${index}`}
                className="flex-shrink-0 transition-all duration-300 hover:scale-110"
                style={{ minWidth: `${100 / sponsors.length}%` }}
              >
                <div className="flex items-center justify-center h-24">
                  <Image
                    src={sponsor.logo}
                    alt={sponsor.name}
                    width={200}
                    height={100}
                    className="object-contain h-20 w-auto max-w-full"
                    unoptimized
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
