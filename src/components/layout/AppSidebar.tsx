'use client';

import {
  Home,
  LogOut,
  Newspaper,
  Trophy,
  Users as PonentesIcon,
  Shield,
  User as PerfilIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/shared/Logo';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { useAuth, useUser } from '@/firebase';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';

const mainMenuItems = [
  { href: '/dashboard', label: 'Eventos', icon: Home },
  { href: '/perfil', label: 'Mi Perfil', icon: PerfilIcon },
  { href: '/ponentes', label: 'Ponentes', icon: PonentesIcon },
  { href: '/ranking', label: 'Ranking', icon: Trophy },
  { href: '/noticias', label: 'Noticias', icon: Newspaper },
];

const adminMenuItems = [
    { href: '/admin/users', label: 'Gestionar Usuarios', icon: Shield },
];

export function AppSidebar() {
  const pathname = usePathname();
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
      });
      return () => unsubscribe();
    }
  }, [auth]);

  return (
    <Sidebar collapsible="icon" aria-label="Navegación Principal">
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        {user && (
          <>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
            <SidebarMenu>
              <SidebarMenuItem>
                 <div className="flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70">
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Admin</span>
                 </div>
              </SidebarMenuItem>
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Cerrar Sesión" asChild>
              <Link href="/">
                <LogOut />
                <span>Cerrar Sesión</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
