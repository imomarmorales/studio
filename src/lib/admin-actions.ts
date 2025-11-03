'use server';

import { initializeFirebase } from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';

const exampleEvents = [
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
  {
    id: 'evento-3',
    title: 'Ponencia: La Revolución del IoT',
    description: 'Descubre cómo el Internet de las Cosas está transformando la industria y la vida cotidiana.',
    dateTime: '2025-11-19T10:00:00',
    location: 'Auditorio B',
    imageUrl: 'https://picsum.photos/seed/evento-3/600/400'
  },
  {
    id: 'evento-4',
    title: 'Concurso de Programación #CodingChallenge',
    description: 'Demuestra tus habilidades de programación y compite por increíbles premios. ¡Inscripciones abiertas!',
    dateTime: '2025-11-19T14:00:00',
    location: 'Sala de Usos Múltiples',
    imageUrl: 'https://picsum.photos/seed/evento-4/600/400'
  },
  {
    id: 'evento-5',
    title: 'Mesa Redonda: El Futuro de las Energías Renovables',
    description: 'Un panel de expertos discutirá los avances y desafíos de las energías limpias en México y el mundo.',
    dateTime: '2025-11-20T12:00:00',
    location: 'Auditorio Principal',
    imageUrl: 'https://picsum.photos/seed/evento-5/600/400'
  }
];

export async function seedEvents(): Promise<void> {
  const { firestore } = initializeFirebase();
  const eventsCollectionRef = collection(firestore, 'congressEvents');
  
  const batch = writeBatch(firestore);

  exampleEvents.forEach((event) => {
    const eventRef = doc(eventsCollectionRef, event.id);
    batch.set(eventRef, event);
  });

  try {
    await batch.commit();
    console.log('Successfully seeded events.');
  } catch (error) {
    console.error('Error seeding events: ', error);
    throw new Error('Failed to seed events.');
  }
}
