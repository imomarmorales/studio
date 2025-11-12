'use client';

import {
  Home,
  LogOut,
  Calendar,
  Trophy,
  Newspaper,
  User,
  Medal,
  Dumbbell
} from 'lucide-react';
import Link from 'next/link';
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
import { usePathname } from 'next/navigation';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

const menuItems = [
  { href: '/dashboard', label: 'Mi Panel', icon: Home },
  { href: '/agenda', label: 'Agenda y Eventos', icon: Calendar },
  { href: '/ranking', label: 'Ranking', icon: Medal },
  { href: '/noticias', label: 'Noticias', icon: Newspaper },
  { href: '/perfil', label: 'Mi Perfil', icon: User },
];


export function AppSidebar() {
  const pathname = usePathname();
  const auth = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };


  return (
    <Sidebar collapsible="icon" aria-label="Navegación Principal">
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild tooltip={item.label} isActive={pathname === item.href}>
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Cerrar Sesión" onClick={handleSignOut}>
                <LogOut />
                <span>Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
