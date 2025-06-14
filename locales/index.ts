import { en } from './en';
import { cn } from './cn';

export const locales = { en, cn};
export type Locale = keyof typeof locales;

export function getLocale(locale: Locale) {
  return locales[locale] || en;
} 