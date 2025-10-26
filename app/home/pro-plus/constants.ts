// path: app/home/pro-plus/constants.ts
import type { Route } from 'next';
import { getProPlusStrings } from '@/lib/i18n/proplus';
import { readLocale } from '@/lib/i18n';

export type Row = { emoji: string; title: string; desc: string; href: Route };

/** Добавляем welcomed=1 (и сохраняем id из текущего URL, если он есть) к любому href */
function withWelcomed(href: Route): Route {
  try {
    // Строим URL относительно текущего origin (в браузере) или фиктивного (на сервере)
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://example.com';
    const url = new URL(href, base);

    // Сохраняем существующие query-параметры href и добавляем welcomed=1
    const sp = new URLSearchParams(url.search);
    sp.set('welcomed', '1');

    // Если мы в браузере — переносим ?id= из текущего адреса
    if (typeof window !== 'undefined') {
      const cur = new URL(window.location.href);
      const id = cur.searchParams.get('id');
      if (id) sp.set('id', id);
    }

    url.search = `?${sp.toString()}`;
    // Возвращаем относительный путь + query как Route
    return (url.pathname + url.search) as Route;
  } catch {
    // Фоллбэк — просто приклеим welcomed=1
    const glue = (href as string).includes('?') ? '&' : '?';
    return (`${href}${glue}welcomed=1`) as Route;
  }
}

/**
 * Фабрика: получить переведённые строки и список карточек
 * для конкретной локали (по умолчанию берём текущую).
 */
export function getProPlusConstants(locale = readLocale()) {
  const { title, subtitle, cta, rows } = getProPlusStrings(locale);
  const rowsWithWelcomed = (rows as Row[]).map((r) => ({
    ...r,
    href: withWelcomed(r.href),
  }));
  return {
    PRO_PLUS_TITLE: title,
    PRO_PLUS_SUBTITLE: subtitle,
    PRO_PLUS_CTA: cta,
    PRO_PLUS_ROWS: rowsWithWelcomed,
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
