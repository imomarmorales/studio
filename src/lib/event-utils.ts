/**
 * Utilidades para manejo de eventos
 * Detección de estado, validaciones y helpers
 */

import { CongressEvent, EventStatus } from './types';
import { addHours, isAfter, isBefore, isWithinInterval } from 'date-fns';

/**
 * Determina el estado actual de un evento basado en su fecha/hora
 * 
 * Lógica de negocio:
 * - 'live': El evento está EN CURSO (entre dateTime y endDateTime)
 * - 'upcoming': El evento aún no ha comenzado
 * - 'past': El evento ya terminó
 * 
 * @param event - Evento a evaluar
 * @returns Estado del evento
 */
export function getEventStatus(event: CongressEvent): EventStatus {
  const now = new Date();
  const startDate = new Date(event.dateTime);
  
  // Si tiene endDateTime, usarlo; sino, asumir duración de 2 horas
  const endDate = event.endDateTime 
    ? new Date(event.endDateTime) 
    : addHours(startDate, 2);

  // Verificar si está en curso
  if (isWithinInterval(now, { start: startDate, end: endDate })) {
    return 'live';
  }

  // Verificar si está por venir
  if (isBefore(now, startDate)) {
    return 'upcoming';
  }

  // Ya pasó
  return 'past';
}

/**
 * Valida si un evento permite marcar asistencia
 * 
 * Reglas:
 * - Solo eventos EN CURSO permiten asistencia
 * - Se puede extender con ventana de tolerancia (±15 min) si es necesario
 * 
 * @param event - Evento a validar
 * @param toleranceMinutes - Minutos de tolerancia antes/después (opcional)
 * @returns true si se puede marcar asistencia
 */
export function canMarkAttendance(event: CongressEvent, toleranceMinutes: number = 0): boolean {
  const now = new Date();
  const startDate = new Date(event.dateTime);
  const endDate = event.endDateTime 
    ? new Date(event.endDateTime) 
    : addHours(startDate, 2);

  // Si hay tolerancia, ajustar ventana
  const windowStart = toleranceMinutes > 0 
    ? addHours(startDate, -toleranceMinutes / 60) 
    : startDate;
  const windowEnd = toleranceMinutes > 0 
    ? addHours(endDate, toleranceMinutes / 60) 
    : endDate;

  return isWithinInterval(now, { start: windowStart, end: windowEnd });
}

/**
 * Formatea la fecha/hora del evento para mostrar
 * 
 * @param dateTimeString - String ISO 8601
 * @returns Formato legible: "Lun 15 Nov • 10:00 AM"
 */
export function formatEventDateTime(dateTimeString: string): string {
  const date = new Date(dateTimeString);
  
  const dayOfWeek = date.toLocaleDateString('es-MX', { weekday: 'short' });
  const day = date.getDate();
  const month = date.toLocaleDateString('es-MX', { month: 'short' });
  const time = date.toLocaleTimeString('es-MX', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  return `${dayOfWeek} ${day} ${month} • ${time}`;
}

/**
 * Formatea la duración del evento
 * 
 * @param startDateTime - Inicio
 * @param endDateTime - Fin (opcional)
 * @returns Duración en formato legible: "2 horas" o "10:00 AM - 12:00 PM"
 */
export function formatEventDuration(startDateTime: string, endDateTime?: string): string {
  const start = new Date(startDateTime);
  const end = endDateTime ? new Date(endDateTime) : addHours(start, 2);

  const startTime = start.toLocaleTimeString('es-MX', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
  const endTime = end.toLocaleTimeString('es-MX', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  return `${startTime} - ${endTime}`;
}

/**
 * Obtiene el color CSS para el estado del evento
 * 
 * @param status - Estado del evento
 * @returns Variable CSS para el color
 */
export function getEventStatusColor(status: EventStatus): string {
  switch (status) {
    case 'live':
      return 'hsl(var(--event-live))';
    case 'upcoming':
      return 'hsl(var(--event-upcoming))';
    case 'past':
      return 'hsl(var(--event-past))';
  }
}

/**
 * Obtiene el label para el estado del evento
 * 
 * @param status - Estado del evento
 * @returns Texto a mostrar en el badge
 */
export function getEventStatusLabel(status: EventStatus): string {
  switch (status) {
    case 'live':
      return '🔴 EN VIVO';
    case 'upcoming':
      return 'PRÓXIMO';
    case 'past':
      return 'FINALIZADO';
  }
}

/**
 * Ordena eventos priorizando:
 * 1. Eventos EN VIVO primero
 * 2. Eventos próximos por fecha ascendente
 * 3. Eventos pasados por fecha descendente
 * 
 * @param events - Array de eventos
 * @returns Array ordenado
 */
export function sortEventsByStatus(events: CongressEvent[]): CongressEvent[] {
  return [...events].sort((a, b) => {
    const statusA = getEventStatus(a);
    const statusB = getEventStatus(b);

    // Prioridad 1: Eventos EN VIVO primero
    if (statusA === 'live' && statusB !== 'live') return -1;
    if (statusB === 'live' && statusA !== 'live') return 1;

    // Prioridad 2: Eventos próximos antes que pasados
    if (statusA === 'upcoming' && statusB === 'past') return -1;
    if (statusB === 'upcoming' && statusA === 'past') return 1;

    // Dentro del mismo estado, ordenar por fecha
    const dateA = new Date(a.dateTime).getTime();
    const dateB = new Date(b.dateTime).getTime();

    if (statusA === 'upcoming') {
      // Próximos: más cercanos primero (ascendente)
      return dateA - dateB;
    } else {
      // Pasados: más recientes primero (descendente)
      return dateB - dateA;
    }
  });
}

/**
 * Filtra eventos por estado
 * 
 * @param events - Array de eventos
 * @param status - Estado a filtrar (o 'all')
 * @returns Eventos filtrados
 */
export function filterEventsByStatus(
  events: CongressEvent[], 
  status: EventStatus | 'all'
): CongressEvent[] {
  if (status === 'all') return events;
  return events.filter(event => getEventStatus(event) === status);
}

/**
 * Calcula cuántos minutos faltan para que inicie un evento
 * 
 * @param event - Evento a evaluar
 * @returns Minutos restantes (negativo si ya pasó o está en curso)
 */
export function getMinutesUntilStart(event: CongressEvent): number {
  const now = new Date();
  const startDate = new Date(event.dateTime);
  const diffMs = startDate.getTime() - now.getTime();
  return Math.floor(diffMs / 1000 / 60);
}

/**
 * Determina si se debe mostrar recordatorio para un evento
 * 
 * @param event - Evento a evaluar
 * @param reminderMinutes - Minutos de anticipación para el recordatorio
 * @returns true si se debe mostrar recordatorio
 */
export function shouldShowReminder(event: CongressEvent, reminderMinutes: number = 30): boolean {
  const minutesUntilStart = getMinutesUntilStart(event);
  return minutesUntilStart > 0 && minutesUntilStart <= reminderMinutes;
}
