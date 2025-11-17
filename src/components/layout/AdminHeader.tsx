'use client';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';
import { usePathname } from 'next/navigation';
import { SidebarTrigger } from '../ui/sidebar';

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
       <div className="md:hidden">
         <SidebarTrigger />
       </div>
       
      <div className="flex-1">
        <h1 className="font-semibold text-xl hidden sm:block">{getPageTitle()}</h1>
      </div>
    </header>
  );
}
