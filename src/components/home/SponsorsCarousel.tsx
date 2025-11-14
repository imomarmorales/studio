'use client';

import Image from 'next/image';
import { useState } from 'react';

interface Sponsor {
  id: string;
  name: string;
  logo: string;
  order: number;
}

export function SponsorsCarousel() {
  // Default sponsors (shows always on public page)
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
