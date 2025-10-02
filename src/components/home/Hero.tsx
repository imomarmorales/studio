import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Countdown } from "./Countdown";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export function Hero() {
  const heroImage = PlaceHolderImages.find(p => p.id === "hero-background");

  return (
    <section className="relative w-full h-[80vh] min-h-[500px] flex items-center justify-center text-center text-white">
      {heroImage && (
        <Image
          src={heroImage.imageUrl}
          alt={heroImage.description}
          fill
          className="object-cover"
          priority
          data-ai-hint={heroImage.imageHint}
        />
      )}
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 p-4 max-w-4xl mx-auto">
        <h1 className="text-4xl font-headline font-bold md:text-6xl drop-shadow-lg">
          Semana de la Ingeniería 2025
        </h1>
        <p className="mt-4 text-lg md:text-xl font-body text-primary-foreground/90 drop-shadow-md">
          Facultad de Ingeniería Tampico, UAT | 18, 19 y 20 de Noviembre del 2025
        </p>
        
        <div className="mt-8">
          <Countdown />
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
