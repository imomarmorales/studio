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
  { href: "/#agenda", label: "Agenda" },
  { href: "/#ponentes", label: "Ponentes" },
  { href: "/#reto-fit", label: "#RetoFIT" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex md:hidden">
          <Link href="/" className="flex items-center space-x-2">
             <Image 
              src="/logo.png" 
              alt="Logo Semana de la Ingeniería"
              width={30}
              height={30}
              className="object-contain"
            />
            <span className="font-bold">Ingeniería</span>
          </Link>
        </div>
        <div className="hidden md:flex mr-6">
             <Image 
              src="/header-logos.png"
              alt="Logos de la UAT y Facultad de Ingeniería de Tampico"
              width={300}
              height={50}
              className="object-contain"
              priority
            />
        </div>
        
        <nav className="hidden items-center space-x-6 text-sm font-medium md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "transition-colors hover:text-foreground/80",
                pathname === link.href ? "text-foreground" : "text-foreground/60"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-2">
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Abrir menú</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <div className="p-4">
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
              </SheetContent>
            </Sheet>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <Button variant="ghost" asChild>
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
            <Button asChild>
              <Link href="/registro">Registrarse</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
