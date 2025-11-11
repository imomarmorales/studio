import type { CongressEvent, EventStatus } from './types';

/**
 * Genera un token aleatorio seguro para QR
 * @param length Longitud del token (default 12)
 */
export function generateQRToken(length: number = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Codifica el QR data para un evento
 * Formato: {eventId}|{qrToken}
 */
export function encodeEventQR(eventId: string, qrToken: string): string {
  return `${eventId}|${qrToken}`;
}

/**
 * Decodifica el QR data
 * @returns {eventId, qrToken} o null si inválido
 */
export function decodeEventQR(qrData: string): { eventId: string; qrToken: string } | null {
  const parts = qrData.split('|');
  if (parts.length !== 2) return null;
  return { eventId: parts[0], qrToken: parts[1] };
}

/**
 * Determina el estado de un evento basado en fecha/hora actual
 */
export function getEventStatus(event: CongressEvent, now: Date = new Date()): EventStatus {
  const startTime = new Date(event.dateTime);
  const endTime = event.endDateTime 
    ? new Date(event.endDateTime) 
    : new Date(startTime.getTime() + 4 * 60 * 60 * 1000); // Default +4 horas

  if (now < startTime) {
    return 'upcoming';
  } else if (now >= startTime && now <= endTime) {
    return 'in-progress';
  } else {
    return 'finished';
  }
}

/**
 * Verifica si un evento puede recibir asistencias
 * Permite un grace period de 15 minutos después del inicio
 */
export function canMarkAttendance(event: CongressEvent, now: Date = new Date()): boolean {
  const startTime = new Date(event.dateTime);
  const gracePeriod = 15 * 60 * 1000; // 15 minutos en ms
  const endTime = event.endDateTime 
    ? new Date(event.endDateTime) 
    : new Date(startTime.getTime() + 4 * 60 * 60 * 1000);

  const allowedStart = new Date(startTime.getTime() - gracePeriod);
  const allowedEnd = endTime;

  return now >= allowedStart && now <= allowedEnd;
}

/**
 * Formatea la fecha y hora de un evento
 */
export function formatEventDateTime(dateTime: string): string {
  const date = new Date(dateTime);
  return new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Formatea solo la hora
 */
export function formatEventTime(dateTime: string): string {
  const date = new Date(dateTime);
  return new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Calcula el tiempo hasta el inicio del evento
 */
export function getTimeUntilEvent(dateTime: string): string {
  const now = new Date();
  const eventDate = new Date(dateTime);
  const diff = eventDate.getTime() - now.getTime();

  if (diff < 0) return 'Evento iniciado';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `En ${days}d ${hours}h`;
  if (hours > 0) return `En ${hours}h ${minutes}m`;
  return `En ${minutes}m`;
}
