'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import type { Participant } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminBottomNav } from '@/components/layout/AdminBottomNav';

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

  if (isUserLoading || isParticipantLoading || !user || participant?.role !== 'admin') {
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
      <div className="min-h-screen bg-muted/40">
        <main className="p-4 sm:p-6 lg:p-8 pb-24">
          {children}
        </main>
        <AdminBottomNav />
      </div>
    </AdminAuthGuard>
  );
}
