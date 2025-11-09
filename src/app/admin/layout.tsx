
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { FirebaseClientProvider } from "@/firebase";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset>
          <AppHeader />
          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </FirebaseClientProvider>
  );
}
