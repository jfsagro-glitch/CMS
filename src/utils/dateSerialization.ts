import type { SafeDateString } from '@/types';

const toIso = (value: Date | string): string => {
  if (value instanceof Date) {
    return value.toISOString();
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }
  return new Date().toISOString();
};

export const toSafeDateString = (value: Date | string | undefined): SafeDateString => {
  return toIso(value ?? new Date()) as SafeDateString;
};

export const fromSafeDateString = (value: SafeDateString | string | Date | undefined): Date => {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};
