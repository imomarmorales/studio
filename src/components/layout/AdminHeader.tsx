'use client';

import { Menu, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { AdminSidebar } from './AdminSidebar';
import { Input } from '../ui/input';

export function AdminHeader() {
  const pathname = usePathname();

  const getPageTitle = (path: string) => {
    if (path.startsWith('/admin/events')) return 'Gestionar Eventos';
    if (path.startsWith('/admin/speakers')) return 'Ponentes';
    if (path.startsWith('/admin/retofit')) return '#RetoFIT';
    if (path.startsWith('/admin/usuarios')) return 'Usuarios';
    if (path.startsWith('/admin/content')) return 'Contenido Principal';
    return 'Panel de Administración';
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0">
          <AdminSidebar />
        </SheetContent>
      </Sheet>

      <div className="w-full flex-1">
        <h1 className="font-semibold text-lg">{getPageTitle(pathname)}</h1>
      </div>
    </header>
  );
}
