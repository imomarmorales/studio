'use client';

import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface Sponsor {
  id: string;
  name: string;
  logo: string; // Base64 or URL
  order: number;
}

export function SponsorsCarousel() {
  const { firestore } = useFirebase();
  const [currentIndex, setCurrentIndex] = useState(0);

  const sponsorsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'sponsors'), orderBy('order', 'asc')) : null),
    [firestore]
  );
  const { data: sponsors } = useCollection<Sponsor>(sponsorsQuery);

  // Auto-scroll carousel
  useEffect(() => {
    if (!sponsors || sponsors.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sponsors.length);
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [sponsors]);

  if (!sponsors || sponsors.length === 0) {
    // Default sponsors while loading or if empty
    const defaultSponsors = [
      { name: 'TechCorp', logo: 'https://via.placeholder.com/200x100/4338ca/ffffff?text=TechCorp' },
      { name: 'InnovateLab', logo: 'https://via.placeholder.com/200x100/7c3aed/ffffff?text=InnovateLab' },
      { name: 'FutureSoft', logo: 'https://via.placeholder.com/200x100/2563eb/ffffff?text=FutureSoft' },
      { name: 'DataMinds', logo: 'https://via.placeholder.com/200x100/0891b2/ffffff?text=DataMinds' },
      { name: 'CloudNine', logo: 'https://via.placeholder.com/200x100/059669/ffffff?text=CloudNine' },
    ];

    return (
      <div className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-foreground">
            Nuestros Patrocinadores
          </h2>
          <div className="relative overflow-hidden">
            <div className="flex items-center justify-center gap-8 md:gap-16">
              {defaultSponsors.map((sponsor, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100"
                >
                  <Image
                    src={sponsor.logo}
                    alt={sponsor.name}
                    width={200}
                    height={100}
                    className="object-contain h-16 w-auto"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show sponsors in an infinite carousel
  const visibleSponsors = [...sponsors, ...sponsors, ...sponsors]; // Triple for infinite effect

  return (
    <div className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-foreground">
          Nuestros Patrocinadores
        </h2>
        <div className="relative overflow-hidden">
          <div
            className="flex items-center gap-8 md:gap-16 transition-transform duration-700 ease-in-out"
            style={{
              transform: `translateX(-${(currentIndex * 100) / sponsors.length}%)`,
            }}
          >
            {visibleSponsors.map((sponsor, index) => (
              <div
                key={`${sponsor.id}-${index}`}
                className="flex-shrink-0 grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100 cursor-pointer"
                style={{ width: `${100 / Math.min(sponsors.length, 5)}%` }}
              >
                <div className="flex items-center justify-center h-24">
                  <Image
                    src={sponsor.logo}
                    alt={sponsor.name}
                    width={200}
                    height={100}
                    className="object-contain h-16 w-auto max-w-full"
                    unoptimized={sponsor.logo.startsWith('data:')}
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
