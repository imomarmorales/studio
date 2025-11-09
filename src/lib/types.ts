import type { Timestamp } from 'firebase/firestore';

export interface Participant {
  id: string; // Corresponds to Firebase Auth UID
  name: string;
  email: string;
  photoURL?: string;
  digitalCredentialQR: string; // Contains the user's UID
  points: number;
  role: 'admin' | 'alumno';
}

export interface CongressEvent {
  id: string;
  title: string;
  description: string;
  dateTime: string; // ISO 8601 format
  location: string;
  imageUrl?: string;
}

export interface Attendance {
  id: string; // auto-generated
  participantId: string;
  eventId: string;
  timestamp: Timestamp;
}

export interface Administrator {
  id: string; // Firebase Auth UID
}
