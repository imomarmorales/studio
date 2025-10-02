
'use client';

import { Shield, Users, Home, LogOut } from 'lucide-react';
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

const menuItems = [
  { href: '/users', label: 'Gestionar Usuarios', icon: Users },
  // Add more admin links here
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
            <SidebarMenuItem>
                <Link href="/dashboard" legacyBehavior passHref>
                    <SidebarMenuButton
                        isActive={pathname.startsWith('/dashboard')}
                        tooltip="Ir al Dashboard"
                    >
                        <Home />
                        <span>Dashboard Usuario</span>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
            <SidebarMenuItem>
                 <div className="flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70">
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Admin</span>
                 </div>
            </SidebarMenuItem>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={`/admin${item.href}`} legacyBehavior passHref>
                <SidebarMenuButton
                  isActive={pathname.startsWith(`/admin${item.href}`)}
                  tooltip={item.label}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/" legacyBehavior passHref>
              <SidebarMenuButton tooltip="Cerrar Sesión">
                <LogOut />
                <span>Cerrar Sesión</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
