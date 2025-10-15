/* path: lib/strings.ts */
import type { Locale } from './i18n';

type Dict = Record<string, string>;
const D = (d: Dict) => d;

export const STRINGS: Record<Locale, Dict> = {
  ru: D({
    brand: 'LiveManager',
    tagline: 'Умные инструменты на каждый день',
    cabinet: 'Личный кабинет',
    buy: 'Купить подписку',
    tasks: 'Ежедневные задачи',
    expert: 'Эксперт центр',
    pro: 'Pro',
    proPlus: 'Pro+',
    langBtn: 'Сменить язык/страну',
    chooseLang: 'Выберите язык интерфейса',
    save: 'Сохранить',
    cancel: 'Отмена',
  }),
  en: D({
    brand: 'LiveManager',
    tagline: 'Smart tools for every day',
    cabinet: 'Account',
    buy: 'Buy subscription',
    tasks: 'Daily tasks',
    expert: 'Expert center',
    pro: 'Pro',
    proPlus: 'Pro+',
    langBtn: 'Change language/country',
    chooseLang: 'Choose interface language',
    save: 'Save',
    cancel: 'Cancel',
  }),
};

export const t = (locale: Locale, key: string, fallback?: string) =>
  STRINGS[locale]?.[key] ?? STRINGS.ru[key] ?? fallback ?? key;
