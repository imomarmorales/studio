'use client';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';
import { usePathname } from 'next/navigation';

export function AdminHeader() {
  const pathname = usePathname();

  const getPageTitle = () => {
    switch (true) {
      case pathname.startsWith('/admin/events'):
        return 'Gestionar Eventos';
      case pathname.startsWith('/admin/usuarios'):
        return 'Usuarios Registrados';
      case pathname.startsWith('/admin/speakers'):
        return 'Gestionar Ponentes';
      case pathname.startsWith('/admin/content'):
        return 'Contenido Principal';
      case pathname.startsWith('/admin/retofit'):
        return 'Flyers de #RetoFIT';
      default:
        return 'Panel de Administración';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
       <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs p-0">
            <AdminSidebar />
        </SheetContent>
      </Sheet>
      <div className="flex-1">
        <h1 className="font-semibold text-xl">{getPageTitle()}</h1>
      </div>
    </header>
  );
}
