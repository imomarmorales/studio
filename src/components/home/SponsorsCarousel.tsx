'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';

interface Sponsor {
  id: string;
  name: string;
  logo: string;
  order: number;
}

export function SponsorsCarousel() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const autoplayPlugin = useRef(
    Autoplay({ delay: 2000, stopOnInteraction: true, stopOnMouseEnter: true })
  );

  // Inicializar Firebase y obtener sponsors
  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
        const firestore = getFirestore(app);
        
        const sponsorsQuery = query(collection(firestore, 'sponsors'), orderBy('order', 'asc'));
        const snapshot = await getDocs(sponsorsQuery);
        const sponsorsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Sponsor[];
        
        setSponsors(sponsorsData);
      } catch (error: any) {
        console.log('No se pudieron cargar sponsors:', error.code);
      } finally {
        setLoading(false);
      }
    };

    fetchSponsors();
  }, []);

  // No mostrar nada si está cargando o no hay sponsors
  if (loading || sponsors.length === 0) {
    return null;
  }

  // Define a reasonable number of sponsors to show per view
  const sponsorsPerView = Math.min(sponsors.length, 5);

  return (
    <div className="py-16 bg-gray-800">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-white">
          Nuestros Patrocinadores
        </h2>
        <Carousel
          opts={{
            align: 'start',
            loop: true,
            slidesPerView: sponsorsPerView,
          }}
          plugins={[autoplayPlugin.current]}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {sponsors.map((sponsor) => (
              <CarouselItem
                key={sponsor.id}
                className="pl-4 basis-auto"
                style={{ flex: `0 0 ${100 / sponsorsPerView}%` }}
              >
                <div className="flex items-center justify-center h-24 p-2">
                  <Image
                    src={sponsor.logo}
                    alt={sponsor.name}
                    width={200}
                    height={100}
                    className="object-contain h-20 w-auto max-w-full transition-all duration-300 hover:scale-110"
                    unoptimized
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  );
}
