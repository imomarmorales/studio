'use client';

import {
  Home,
  LogOut,
  Menu,
  Calendar,
  Users,
  UserCircle,
  Layers,
  Dumbbell
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose
} from '@/components/ui/sheet';

const menuItems = [
  { href: '/admin/events', label: 'Eventos', icon: Calendar },
  { href: '/admin/speakers', label: 'Ponentes', icon: UserCircle },
  { href: '/admin/retofit', label: '#RetoFIT', icon: Dumbbell },
  { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { href: '/admin/content', label: 'Contenido', icon: Layers },
];

export function AdminHeader() {
  const pathname = usePathname();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      toast({
        title: 'Sesión cerrada',
        description: 'Has cerrado sesión correctamente.',
      });
      router.push('/login');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cerrar la sesión.',
      });
    }
  };

  const getPageTitle = (path: string) => {
    const item = menuItems.find(item => path.startsWith(item.href));
    return item ? item.label : 'Panel de Administración';
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
        <SheetContent side="left" className="sm:max-w-xs">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="/"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            >
              <Home className="h-5 w-5 transition-all group-hover:scale-110" />
              <span className="sr-only">Semana de la Ingeniería</span>
            </Link>
            {menuItems.map((item) => (
              <SheetClose asChild key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-4 px-2.5 ${
                    pathname.startsWith(item.href)
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </SheetClose>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-5 w-5" />
              Cerrar Sesión
            </button>
          </nav>
        </SheetContent>
      </Sheet>
       <div className="hidden sm:block">
          <h1 className="text-2xl font-bold">{getPageTitle(pathname)}</h1>
        </div>
    </header>
  );
}
