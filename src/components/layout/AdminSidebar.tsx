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

export function AdminSidebar() {

  return (
    <Sidebar collapsible="icon" aria-label="Navegación de Administrador">
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
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
