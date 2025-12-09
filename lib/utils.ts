import { v5 as uuidv5 } from 'uuid';
import { UUID_V5_NAMESPACE } from './constants';

export function normalizePassport(passport: string): string {
  return passport.replace(/[\s\-]/g, '').toUpperCase();
}

export function generateRefId(passportNumber: string): string {
  const normalized = normalizePassport(passportNumber);
  return uuidv5(normalized, UUID_V5_NAMESPACE);
}

export function formatDateForDisplay(date: string, locale: string): string {
  const d = new Date(date);
  if (locale === 'th') {
    return d.toLocaleDateString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  return d.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
}

export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getMaxDate(): string {
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 20, today.getMonth(), today.getDate());
  return formatDateForInput(maxDate);
}
