'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { collection, query, orderBy, where, getDocs, getFirestore } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import type { RetoFitFlyer } from '@/lib/types';
import { Skeleton } from "@/components/ui/skeleton";
import { PublicLayout } from "@/components/layout/PublicLayout";

// Datos de ejemplo para pruebas locales
const exampleFlyers: RetoFitFlyer[] = [
  {
    id: 'example-1',
    title: '¡Inscripciones Abiertas!',
    description: '',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmZjZiNmI7c3RvcC1vcGFjaXR5OjEiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmZjg3MDA7c3RvcC1vcGFjaXR5OjEiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0idXJsKCNhKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNDAlIiBmb250LXNpemU9IjQ4IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPklOU0NSSVBDSU9ORVMgQUJJRVJUQVM8L3RleHQ+PHRleHQgeD0iNTAlIiB5PSI2MCUiIGZvbnQtc2l6ZT0iMzIiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj4jUmV0b0ZJVCA1SzwvdGV4dD48L3N2Zz4=',
    link: '',
    order: 1,
    active: true,
  },
  {
    id: 'example-2',
    title: 'Premios y Reconocimientos',
    description: '',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImIiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmQ3MDA7c3RvcC1vcGFjaXR5OjEiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmFiMDA7c3RvcC1vcGFjaXR5OjEiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0idXJsKCNiKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNDAlIiBmb250LXNpemU9IjY0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+PhjwvdGV4dD48dGV4dCB4PSI1MCUiIHk9IjYwJSIgZm9udC1zaXplPSIzNiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5QUkVNSU9TIEVTUEVDSUFMRVM8L3RleHQ+PC9zdmc+',
    link: '',
    order: 2,
    active: true,
  },
  {
    id: 'example-3',
    title: 'Entrenamiento Grupal',
    description: '',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImMiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM0Y2FmNTA7c3RvcC1vcGFjaXR5OjEiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMyMTk2ZjM7c3RvcC1vcGFjaXR5OjEiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0idXJsKCNjKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNDAlIiBmb250LXNpemU9IjQ4IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkVOVFJFTkFNSUVOVE8gR1JVUEFMPC90ZXh0Pjx0ZXh0IHg9IjUwJSIgeT0iNjAlIiBmb250LXNpemU9IjI4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TWFydGVzICYgSnVldmVzIDY6MDAgUE08L3RleHQ+PC9zdmc+',
    link: '',
    order: 3,
    active: true,
  },
];

export default function RetoFitPage() {
  const [displayFlyers, setDisplayFlyers] = useState<RetoFitFlyer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFlyers = async () => {
      try {
        // Initialize Firebase if needed
        if (!getApps().length) {
          initializeApp(firebaseConfig);
        }

      const db = getFirestore();
      const flyersRef = collection(db, 'retofit_flyers');
      const q = query(flyersRef, orderBy('order', 'asc'));
      const snapshot = await getDocs(q);

      const flyersData = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as RetoFitFlyer))
        .filter(flyer => flyer.active !== false);

      setDisplayFlyers(flyersData);
      } catch (error) {
        console.error('Error fetching flyers:', error);
        // Mostrar datos de ejemplo si hay error
        setDisplayFlyers(exampleFlyers);
      } finally {
        setLoading(false);
      }
    };

    fetchFlyers();
  }, []);

  return (
    <PublicLayout>
      <div className="space-y-6">
        {loading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="w-full h-64 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {displayFlyers.map((flyer) => (
              <Card key={flyer.id} className="overflow-hidden">
                <div className="relative w-full">
                  <img
                    src={flyer.image}
                    alt={flyer.title}
                    className="w-full h-auto object-contain"
                  />
                </div>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{flyer.title}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
