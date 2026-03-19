import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Formate une date ISO en format long lisible en français.
 *
 * @example
 *   formatDate('2024-03-15')  // → "15 mars 2024"
 */
export function formatDate(
  date: string | Date,
  pattern = 'd MMMM yyyy'
): string {
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return '—';
  return format(parsed, pattern, { locale: fr });
}

/**
 * Formate une date en format court (jj/mm/aaaa).
 *
 * @example
 *   formatDateShort('2024-03-15')  // → "15/03/2024"
 */
export function formatDateShort(date: string | Date): string {
  return formatDate(date, 'dd/MM/yyyy');
}

/**
 * Retourne une distance relative à maintenant ("il y a 3 jours").
 */
export function formatRelative(date: string | Date): string {
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return '—';
  return formatDistanceToNow(parsed, { addSuffix: true, locale: fr });
}

/**
 * Retourne le mois et l'année (ex. "Mars 2024").
 */
export function formatMonthYear(date: string | Date): string {
  return formatDate(date, 'MMMM yyyy');
}
