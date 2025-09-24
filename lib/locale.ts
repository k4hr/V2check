// lib/locale.ts
export function resolveLocaleByCountry(code: string): string {
  const c = code.toUpperCase();
  const map: Record<string, string> = {
    RU: 'ru', BY: 'ru', UA: 'uk',
    KZ: 'kk', UZ: 'ru', KG: 'ru',
    AM: 'hy', AZ: 'az', GE: 'ka', MD: 'ru',
    TR: 'tr',

    AE: 'en', SA: 'en', QA: 'en', KW: 'en', BH: 'en', OM: 'en', JO: 'en', IL: 'en', EG: 'en',
    IN: 'en', ID: 'en', MY: 'en', PH: 'en', VN: 'en', TH: 'en', SG: 'en',
    PL: 'en', CZ: 'en', SK: 'en', HU: 'en', RO: 'en', BG: 'en', RS: 'en',
    US: 'en',
  };
  return map[c] || 'en'; // дефолт — английский
}
