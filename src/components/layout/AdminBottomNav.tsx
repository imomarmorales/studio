'use client';

import { Calendar, Users, UserCircle, Layers, Dumbbell } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const menuItems = [
  { href: '/admin/events', label: 'Eventos', icon: Calendar },
  { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { href: '/admin/speakers', label: 'Ponentes', icon: UserCircle },
  { href: '/admin/content', label: 'Contenido', icon: Layers },
  { href: '/admin/retofit', label: '#RetoFIT', icon: Dumbbell },
];

export function AdminBottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background shadow-lg md:hidden">
      <nav className="grid h-16 grid-cols-5 items-center justify-center text-xs">
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 h-full transition-colors hover:bg-muted',
                isActive ? 'text-primary font-semibold' : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
