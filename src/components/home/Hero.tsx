"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import dynamic from 'next/dynamic';

const DynamicCountdown = dynamic(() => import('./Countdown').then(mod => mod.Countdown), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center space-x-2 md:space-x-4" aria-label="Cargando cuenta regresiva">
      {['Días', 'Horas', 'Minutos', 'Segundos'].map((label) => (
        <div key={label} className="text-center bg-white/10 backdrop-blur-sm p-4 rounded-lg w-24">
          <span className="text-3xl md:text-5xl font-bold font-headline">00</span>
          <p className="text-xs md:text-sm uppercase tracking-widest">{label}</p>
        </div>
      ))}
    </div>
  )
});


export function Hero() {
  return (
    <section className="relative w-full h-[80vh] min-h-[500px] flex items-center justify-center text-center text-white">
      <Image
        src="/hero-background.jpeg"
        alt="Fondo de la Semana de la Ingeniería"
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 p-4 max-w-4xl mx-auto">
        <h1 className="text-4xl font-headline font-bold md:text-6xl drop-shadow-lg">
          Semana de la Ingeniería 2025
        </h1>
        <p className="mt-4 text-lg md:text-xl font-body text-primary-foreground/90 drop-shadow-md">
          Facultad de Ingeniería Tampico, UAT | 18, 19 y 20 de Noviembre del 2025
        </p>
        
        <div className="mt-8">
          <DynamicCountdown />
        </div>

        <div className="mt-10">
          <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/registro">¡Regístrate Ahora!</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
