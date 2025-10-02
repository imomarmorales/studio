"use client";

import {
  Calendar,
  Flame,
  Home,
  LogOut,
  Medal,
  Newspaper,
  Trophy,
  Users,
  GraduationCap
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/shared/Logo";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/ponentes", label: "Ponentes", icon: Users },
  { href: "/noticias", label: "Noticias", icon: Newspaper },
  { href: "/ranking", label: "Ranking", icon: Trophy },
  { href: "/concursos", label: "Concursos", icon: Medal },
  { href: "/coloquio", label: "Coloquio", icon: GraduationCap },
  { href: "/reto-fit", label: "#RetoFIT", icon: Flame },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
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
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
         <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Cerrar Sesión">
              <Link href="/">
                  <LogOut/>
                  <span>Cerrar Sesión</span>
              </Link>
            </SidebarMenuButton>
         </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
