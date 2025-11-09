'use client';

import { Shield, Users, Home, LogOut, Calendar } from 'lucide-react';
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

const menuItems = [
    { href: '/admin/events', label: 'Gestionar Eventos', icon: Calendar },
    { href: '/admin/users', label: 'Gestionar Usuarios', icon: Users },
]

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <Sidebar collapsible="icon" aria-label="Navegación de Administrador">
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
            {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild tooltip={item.label} isActive={pathname.startsWith(item.href)}>
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
