import { format, isValid } from 'date-fns';

/**
 * Format a date string to a human-readable format
 */
export function formatDate(date: string | Date, formatStr: string = 'PPpp'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return isValid(dateObj) ? format(dateObj, formatStr) : 'Invalid date';
}

/**
 * Get status color for Material-UI components
 */
export function getStatusColor(status: string): 'success' | 'warning' | 'error' | 'default' {
  switch (status.toLowerCase()) {
    case 'operational':
    case 'approved':
    case 'completed':
      return 'success';
    case 'maintenance':
    case 'pending':
    case 'in_progress':
      return 'warning';
    case 'out_of_order':
    case 'denied':
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
}

/**
 * Check if a date range overlaps with existing reservations
 */
export function hasTimeConflict(
  startTime: Date,
  endTime: Date,
  existingReservations: { start_time: string; end_time: string }[]
): boolean {
  return existingReservations.some(reservation => {
    const reservationStart = new Date(reservation.start_time);
    const reservationEnd = new Date(reservation.end_time);
    return (
      (startTime >= reservationStart && startTime < reservationEnd) ||
      (endTime > reservationStart && endTime <= reservationEnd) ||
      (startTime <= reservationStart && endTime >= reservationEnd)
    );
  });
}

/**
 * Generate a random color based on a string
 */
export function stringToColor(string: string): string {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
}

/**
 * Get initials from a string (e.g., email or name)
 */
export function getInitials(string: string): string {
  return string
    .split('@')[0] // Remove domain part if it's an email
    .split(/[\s._-]/) // Split by space, dot, underscore, or hyphen
    .map(word => word[0]?.toUpperCase() || '')
    .slice(0, 2)
    .join('');
}