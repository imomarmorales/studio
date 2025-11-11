import type { Timestamp } from 'firebase/firestore';

export interface Participant {
  id: string; // Corresponds to Firebase Auth UID
  name: string;
  email: string;
  photoURL?: string;
  digitalCredentialQR: string; // Contains the user's UID
  points: number;
  role: 'admin' | 'alumno';
  badges?: Badge[];
  attendanceCount?: number;
  createdAt?: Timestamp;
}

export interface CongressEvent {
  id: string;
  title: string;
  description: string;
  dateTime: string; // ISO 8601 format - start time
  endDateTime?: string; // ISO 8601 format - end time (optional, default +4h)
  location: string;
  imageUrl?: string;
  pointsPerAttendance: number; // Default 100
  qrToken: string; // Random token for QR validation
  qrValid: boolean; // Admin can invalidate
  createdBy?: string; // Admin UID
  speakers?: string[]; // Array of speaker names
  duration?: string; // e.g., "2 horas"
  attendanceRules?: string; // Custom rules text
}

export interface Attendance {
  id: string; // Format: {userId}_{eventId}
  participantId: string;
  eventId: string;
  timestamp: Timestamp;
  pointsEarned: number;
}

export interface Administrator {
  id: string; // Firebase Auth UID
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  requirement: number; // Number of attendances required
  earnedAt?: Timestamp;
}

export type EventStatus = 'upcoming' | 'in-progress' | 'finished';
