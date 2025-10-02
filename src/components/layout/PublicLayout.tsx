import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import Image from "next/image";

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="w-full bg-background flex justify-center py-2 border-b">
         <Image 
          src="/header-logos.png"
          alt="Logos de la UAT y Facultad de Ingeniería de Tampico"
          width={400}
          height={60}
          className="object-contain"
          priority
        />
      </header>
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
