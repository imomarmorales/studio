'use client';

import { Shield, Users, Home, LogOut, Calendar, X } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';

const menuItems = [
    { href: '/admin/events', label: 'Gestionar Eventos', icon: Calendar },
    { href: '/admin/usuarios', label: 'Usuarios Registrados', icon: Users },
]

export function AdminSidebar() {
  const pathname = usePathname();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { toggleSidebar, isMobile } = useSidebar();

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
      console.error('Error al cerrar sesión:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cerrar la sesión.',
      });
    }
  };

  return (
    <Sidebar collapsible="icon" aria-label="Navegación de Administrador" className="overflow-hidden">
      <SidebarHeader className="relative">
        <Logo />
        {/* Close Button - Only visible on mobile */}
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-8 w-8 md:hidden"
            onClick={toggleSidebar}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </SidebarHeader>
      <SidebarContent className="overflow-y-auto">
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
      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
              <SidebarMenuButton 
                tooltip="Cerrar Sesión" 
                onClick={handleLogout}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut />
                <span>Cerrar Sesión</span>
              </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
