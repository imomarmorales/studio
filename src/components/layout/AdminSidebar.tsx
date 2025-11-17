'use client';

import {
  Home,
  LogOut,
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
import { Logo } from '../shared/Logo';

const menuItems = [
  { href: '/admin/events', label: 'Gestionar Eventos', icon: Calendar },
  { href: '/admin/speakers', label: 'Ponentes', icon: UserCircle },
  { href: '/admin/retofit', label: '#RetoFIT', icon: Dumbbell },
  { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { href: '/admin/content', label: 'Contenido Principal', icon: Layers },
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
    <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Logo />
        </div>
        <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                {menuItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
                            pathname.startsWith(item.href)
                            ? 'bg-muted text-primary'
                            : 'text-muted-foreground'
                        }`}
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
