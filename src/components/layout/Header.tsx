"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import Image from "next/image";

const navLinks = [
  { href: "/agenda-publica", label: "Agenda" },
  { href: "/ponentes-publicos", label: "Ponentes" },
  { href: "/reto-fit", label: "#RetoFIT" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-16 items-center">
        {/* Mobile View: Hamburger menu and centered logos */}
        <div className="flex items-center justify-between w-full md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Abrir menú</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0">
                <div className="p-4 border-b">
                  <Logo />
                </div>
                <nav className="mt-4 flex flex-col space-y-2 p-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-lg font-medium text-foreground/70 hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
                <div className="absolute bottom-4 left-4 right-4 flex flex-col space-y-2">
                    <Button variant="outline" asChild>
                      <Link href="/login">Iniciar Sesión</Link>
                    </Button>
                    <Button asChild>
                      <Link href="/registro">Registrarse</Link>
                    </Button>
                </div>
              </SheetContent>
            </Sheet>
            
            <div className="flex justify-center">
                 <Image
                    src="/header-logos.png"
                    alt="Logos de la UAT y Facultad de Ingeniería de Tampico"
                    width={250}
                    height={40}
                    className="object-contain"
                    priority
                />
            </div>

            {/* Spacer */}
            <div className="w-10"></div>
        </div>

        {/* Desktop View */}
        <div className="hidden w-full items-center justify-between md:flex">
          <div className="flex items-center gap-4">
            <Image
                src="/header-logos.png"
                alt="Logos de la UAT y Facultad de Ingeniería de Tampico"
                width={300}
                height={50}
                className="object-contain"
                priority
              />
          </div>

          <nav className="flex items-center gap-6 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-foreground/70 transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
            <Button asChild>
              <Link href="/login">Registrarse</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
