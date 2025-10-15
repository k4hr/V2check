/* path: lib/i18n.ts */
'use client';

export type Locale = 'ru' | 'en';

export const FALLBACK: Locale = 'ru';
export const KNOWN: Locale[] = ['ru', 'en'];

export const STRINGS: Record<Locale, any> = {
  ru: {
    appTitle:'LiveManager', subtitle:'Умные инструменты на каждый день',
    cabinet:'Личный кабинет', buy:'Купить подписку', daily:'Ежедневные задачи',
    expert:'Эксперт центр', changeLang:'Сменить язык', chooseLang:'Выберите язык интерфейса',
    cancel:'Отмена', save:'Сохранить', pro:'Pro', proplus:'Pro+', free:'Бесплатно',
  },
  en: {
    appTitle:'LiveManager', subtitle:'Smart tools for every day',
    cabinet:'Account', buy:'Buy subscription', daily:'Daily tasks',
    expert:'Expert Center', changeLang:'Change language', chooseLang:'Choose interface language',
    cancel:'Cancel', save:'Save', pro:'Pro', proplus:'Pro+', free:'Free',
  },
};

function readCookie(name: string): string {
  try {
    const p = (document.cookie || '').split('; ').find(x => x.startsWith(name + '='));
    return p ? decodeURIComponent(p.split('=').slice(1).join('=')) : '';
  } catch { return ''; }
}

/** Читаем язык: 1) locale/NEXT_LOCALE cookie, 2) fallback */
export function readLocale(): Locale {
  const raw = (readCookie('NEXT_LOCALE') || readCookie('locale') || '').toLowerCase();
  return KNOWN.includes(raw as Locale) ? (raw as Locale) : FALLBACK;
}

/** Пишем язык сразу в две куки + html@lang */
export function setLocaleEverywhere(code: Locale) {
  const maxAge = 60 * 60 * 24 * 365;
  const safe = KNOWN.includes(code) ? code : FALLBACK;
  const put = (k: string, v: string) =>
    document.cookie = `${k}=${encodeURIComponent(v)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;

  put('locale', safe);
  put('NEXT_LOCALE', safe);
  try { document.documentElement.lang = safe; } catch {}
}
