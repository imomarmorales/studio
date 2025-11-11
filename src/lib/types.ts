import type { Timestamp } from 'firebase/firestore';

export interface Participant {
  id: string; // Corresponds to Firebase Auth UID
  name: string;
  email: string;
  photoURL?: string;
  digitalCredentialQR: string; // Contains the user's UID
  points: number;
  role: 'admin' | 'alumno';
  badges?: string[]; // IDs de badges desbloqueados
  createdAt?: Timestamp;
}

export type EventStatus = 'upcoming' | 'live' | 'past';

export interface CongressEvent {
  id: string;
  title: string;
  description: string;
  dateTime: string; // ISO 8601 format - inicio del evento
  endDateTime?: string; // ISO 8601 format - fin del evento (opcional, default +2h)
  location: string;
  imageUrl?: string;
  points: number; // Puntos otorgados por asistencia (default 100)
  qrCode: string; // ID único para validación del QR
  speakers?: string[]; // Nombres de ponentes
  maxCapacity?: number; // Aforo máximo (opcional)
  category?: string; // Tipo de evento: Conferencia, Taller, etc
  createdBy?: string; // UID del admin que creó el evento
  createdAt?: Timestamp;
}

export interface Attendance {
  id: string; // Compuesto: {userId}_{eventId}
  participantId: string;
  eventId: string;
  eventTitle?: string; // Desnormalizado para historial
  pointsEarned: number; // Puntos otorgados en ese momento
  timestamp: Timestamp;
  verified: boolean; // Flag de validación
}

export interface Administrator {
  id: string; // Firebase Auth UID
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  color: string; // Color hex del badge
  requirement: {
    type: 'attendance_count' | 'points_total' | 'special';
    value: number;
  };
}

