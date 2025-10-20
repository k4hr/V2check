// path: app/home/pro-plus/constants.ts
import type { Route } from 'next';
import { getProPlusStrings } from '@/lib/i18n/proplus';
import { readLocale } from '@/lib/i18n';

export type Row = { emoji: string; title: string; desc: string; href: Route };

export function getProPlusConstants(locale = readLocale()) {
  const { title, subtitle, cta, rows } = getProPlusStrings(locale);
  return {
    PRO_PLUS_TITLE: title,
    PRO_PLUS_SUBTITLE: subtitle,
    PRO_PLUS_CTA: cta,
    PRO_PLUS_ROWS: rows as Row[],
  };
}
