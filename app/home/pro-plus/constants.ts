// path: app/home/pro-plus/constants.ts
import type { Route } from 'next';
import { getProPlusStrings } from '@/lib/i18n/proplus';
import { readLocale } from '@/lib/i18n';

export type Row = { emoji: string; title: string; desc: string; href: Route };

/**
 * Фабрика: получить переведённые строки и список карточек
 * для конкретной локали (по умолчанию берём текущую).
 */
export function getProPlusConstants(locale = readLocale()) {
  const { title, subtitle, cta, rows } = getProPlusStrings(locale);
  return {
    PRO_PLUS_TITLE: title,
    PRO_PLUS_SUBTITLE: subtitle,
    PRO_PLUS_CTA: cta,
    PRO_PLUS_ROWS: rows as Row[],
  };
}

/**
 * Именованные экспорты — чтобы работать со старыми импортами вида:
 *   import { PRO_PLUS_TITLE, PRO_PLUS_ROWS } from '@/app/home/pro-plus/constants'
 *
 * Они вычисляются при импорте, используя текущую локаль.
 */
const _now = getProPlusConstants();
export const PRO_PLUS_TITLE = _now.PRO_PLUS_TITLE;
export const PRO_PLUS_SUBTITLE = _now.PRO_PLUS_SUBTITLE;
export const PRO_PLUS_CTA = _now.PRO_PLUS_CTA;
export const PRO_PLUS_ROWS: Row[] = _now.PRO_PLUS_ROWS;
