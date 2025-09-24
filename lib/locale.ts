export type Locale = 'ru' | 'uk' | 'kk' | 'tr' | 'az' | 'ka' | 'hy' | 'en';

export const COUNTRY_TO_LOCALE: Record<string, Locale> = {
  RU: 'ru',
  BY: 'ru',
  KZ: 'kk',
  UA: 'uk',
  UZ: 'ru',
  KG: 'ru',
  AM: 'hy',
  AZ: 'az',
  GE: 'ka',
  MD: 'ru',
  TJ: 'ru',
  TM: 'ru',
  TR: 'tr',
  AE: 'en',
  IN: 'en',
  EU: 'en',
  US: 'en',
};

export const DEFAULT_LOCALE: Locale = 'ru';

export function resolveLocaleByCountry(country: string | null | undefined): Locale {
  if (!country) return DEFAULT_LOCALE;
  const code = country.toUpperCase();
  return COUNTRY_TO_LOCALE[code] ?? DEFAULT_LOCALE;
}
