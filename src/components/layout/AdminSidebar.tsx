'use client';

import {
  Calendar,
  Users,
  UserCircle,
  Layers,
  Dumbbell,
  LogOut,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Logo } from '../shared/Logo';
import { cn } from '@/lib/utils';

const menuItems = [
  { href: '/admin/events', label: 'Eventos', icon: Calendar },
  { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { href: '/admin/speakers', label: 'Ponentes', icon: UserCircle },
  { href: '/admin/content', label: 'Contenido', icon: Layers },
  { href: '/admin/retofit', label: '#RetoFIT', icon: Dumbbell },
];

export function AdminSidebar() {
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

  return (
    <div className="hidden md:flex md:flex-col md:h-full">
      <div className="flex h-16 items-center border-b px-6">
        <Logo />
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="grid items-start px-4 text-sm font-medium">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted',
                pathname.startsWith(item.href) && 'bg-muted text-primary'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-auto p-4">
        <Button size="sm" className="w-full" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
}
