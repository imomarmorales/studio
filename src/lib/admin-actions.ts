'use client';

import { collection, doc, writeBatch, Firestore, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { CongressEvent } from './types';


export async function seedEvents(firestore: Firestore): Promise<void> {
  
  const exampleEventsData = [
    {
      id: 'evento-1',
      title: 'Conferencia Inaugural: IA en la Ingeniería',
      description: 'El Dr. Alan Turing explorará el impacto de la inteligencia artificial en las disciplinas de la ingeniería moderna.',
      dateTime: '2025-11-18T09:00:00',
      location: 'Auditorio Principal',
      imageUrl: 'https://picsum.photos/seed/evento-1/600/400'
    },
    {
      id: 'evento-2',
      title: 'Taller: Desarrollo de Apps con React y Firebase',
      description: 'Un taller práctico donde aprenderás a construir aplicaciones web modernas utilizando las tecnologías más demandadas.',
      dateTime: '2025-11-18T11:00:00',
      location: 'Laboratorio de Cómputo 1',
      imageUrl: 'https://picsum.photos/seed/evento-2/600/400'
    },
  ];

  const eventsCollectionRef = collection(firestore, 'congressEvents');
  const batch = writeBatch(firestore);

  const seedData = exampleEventsData.map(event => ({
    ...event,
    _isSeedData: true,
    createdAt: serverTimestamp(),
  }));

  seedData.forEach((event) => {
    const eventRef = doc(eventsCollectionRef, event.id);
    batch.set(eventRef, event);
  });

  try {
    await batch.commit();
    console.log('Successfully seeded events.');
  } catch (error) {
    const permissionError = new FirestorePermissionError({
        path: 'congressEvents', 
        operation: 'write', 
        requestResourceData: seedData 
    });

    errorEmitter.emit('permission-error', permissionError);
    throw error;
  }
}
