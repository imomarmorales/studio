'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import type { Participant } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';

function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();

  const userDocRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );

  const { data: participant, isLoading: isParticipantLoading } = useDoc<Participant>(userDocRef);

  useEffect(() => {
    const isLoading = isUserLoading || isParticipantLoading;
    if (!isLoading) {
      if (!user || participant?.role !== 'admin') {
        router.push('/login');
      }
    }
  }, [isUserLoading, isParticipantLoading, user, participant, router]);

  const isLoading = isUserLoading || isParticipantLoading;

  if (isLoading || !user || participant?.role !== 'admin') {
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

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        {/* Mobile Header with Menu Trigger */}
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:hidden">
          <SidebarTrigger className="h-10 w-10 -ml-2" />
          <h1 className="text-lg font-semibold">Panel de Admin</h1>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <AdminAuthGuard>{children}</AdminAuthGuard>
    </FirebaseClientProvider>
  );
}
