// lib/i18n.ts
export type Locale =
  | 'ru' | 'en' | 'uk' | 'kk' | 'tr' | 'az' | 'ka' | 'hy'
  | 'be' | 'uz' | 'ky' | 'ro'
  | 'ar' | 'he'
  | 'hi' | 'id' | 'ms' | 'fil' | 'vi' | 'th'
  | 'pl' | 'cs' | 'sk' | 'hu' | 'bg' | 'sr';

const FALLBACK: Locale = 'ru';

export const KNOWN: Locale[] = [
  'ru','en','uk','kk','tr','az','ka','hy',
  'be','uz','ky','ro',
  'ar','he',
  'hi','id','ms','fil','vi','th',
  'pl','cs','sk','hu','bg','sr',
];

function readCookie(name: string): string {
  try {
    const p = (document.cookie || '').split('; ').find(x => x.startsWith(name + '='));
    return p ? decodeURIComponent(p.split('=').slice(1).join('=')) : '';
  } catch { return ''; }
}

/** Маппинг страны -> дефолтный язык интерфейса */
export function localeForCountry(cc: string | null | undefined): Locale {
  const code = String(cc || '').toUpperCase();

  // СНГ и рядом
  if (['RU'].includes(code)) return 'ru';
  if (['BY'].includes(code)) return 'be';       // можно переключить на 'ru', если надо
  if (['UA'].includes(code)) return 'uk';
  if (['KZ'].includes(code)) return 'kk';
  if (['UZ'].includes(code)) return 'uz';
  if (['KG'].includes(code)) return 'ky';
  if (['AM'].includes(code)) return 'hy';
  if (['AZ'].includes(code)) return 'az';
  if (['GE'].includes(code)) return 'ka';
  if (['MD'].includes(code)) return 'ro';
  if (['TR'].includes(code)) return 'tr';

  // MENA
  if (['AE','SA','QA','KW','BH','OM','JO','EG'].includes(code)) return 'ar';
  if (['IL'].includes(code)) return 'he';

  // Южная/ЮВ Азия
  if (['IN'].includes(code)) return 'hi';
  if (['ID'].includes(code)) return 'id';
  if (['MY'].includes(code)) return 'ms';
  if (['PH'].includes(code)) return 'fil';
  if (['VN'].includes(code)) return 'vi';
  if (['TH'].includes(code)) return 'th';
  if (['SG'].includes(code)) return 'en';

  // ЦВЕ Европа
  if (['PL'].includes(code)) return 'pl';
  if (['CZ'].includes(code)) return 'cs';
  if (['SK'].includes(code)) return 'sk';
  if (['HU'].includes(code)) return 'hu';
  if (['RO'].includes(code)) return 'ro';
  if (['BG'].includes(code)) return 'bg';
  if (['RS'].includes(code)) return 'sr';

  // Северная Америка
  if (['US'].includes(code)) return 'en';

  return FALLBACK;
}

/** Читаем язык: 1) locale/NEXT_LOCALE cookie, 2) страна -> язык, 3) fallback */
export function readLocale(): Locale {
  const raw = (readCookie('NEXT_LOCALE') || readCookie('locale') || '').toLowerCase();
  if (KNOWN.includes(raw as Locale)) return raw as Locale;
  const byCountry = localeForCountry(readCookie('country'));
  return KNOWN.includes(byCountry) ? byCountry : FALLBACK;
}

/** Пишем язык сразу в две куки + html@lang + localStorage */
export function setLocaleEverywhere(code: Locale) {
  const maxAge = 60 * 60 * 24 * 365;
  const put = (k: string, v: string) =>
    document.cookie = `${k}=${encodeURIComponent(v)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;

  const safe = KNOWN.includes(code) ? code : FALLBACK;
  put('locale', safe);
  put('NEXT_LOCALE', safe);
  try { localStorage.setItem('locale', safe); } catch {}
  try { document.documentElement.lang = safe; } catch {}
}
