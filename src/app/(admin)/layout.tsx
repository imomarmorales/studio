'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminBottomNav } from '@/components/layout/AdminBottomNav';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AdminHeader } from '@/components/layout/AdminHeader';


function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  // El email del admin es una forma rápida y segura de verificar el rol sin leer Firestore
  const isAdminByEmail = user?.email === 'admin@congreso.mx' || user?.email === 'admin@congreso.com';

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
    // Si el usuario está cargado y no es un admin, lo saca.
    if (!isUserLoading && user && !isAdminByEmail) {
      router.push('/agenda');
    }
  }, [isUserLoading, user, isAdminByEmail, router]);

  if (isUserLoading || !user || !isAdminByEmail) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGuard>
      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset>
          <AdminHeader />
          <main className="p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
            {children}
          </main>
          <AdminBottomNav />
        </SidebarInset>
      </SidebarProvider>
    </AdminAuthGuard>
  );
}
