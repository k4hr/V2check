export type Lang = { code: string; name: string; native: string; flag: string };

export const LANGUAGES: Lang[] = [
  { code: 'ru', name: 'Russian',     native: 'Русский',            flag: '🇷🇺' },
  { code: 'uk', name: 'Ukrainian',   native: 'Українська',         flag: '🇺🇦' },
  { code: 'kk', name: 'Kazakh',      native: 'Қазақша',            flag: '🇰🇿' },
  { code: 'tr', name: 'Turkish',     native: 'Türkçe',             flag: '🇹🇷' },
  { code: 'az', name: 'Azerbaijani', native: 'Azərbaycan dili',    flag: '🇦🇿' },
  { code: 'ka', name: 'Georgian',    native: 'ქართული',            flag: '🇬🇪' },
  { code: 'hy', name: 'Armenian',    native: 'Հայերեն',            flag: '🇦🇲' },
  { code: 'en', name: 'English',     native: 'English',            flag: '🇺🇸' },
];
