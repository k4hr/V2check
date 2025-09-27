// lib/pricing.ts
export type Plan = 'WEEK' | 'MONTH' | 'HALF' | 'HALF_YEAR' | 'YEAR';
export type Tier = 'pro' | 'proplus';

export type PricingItem = {
  label: string;      // для чека в Stars
  title: string;      // читаемое имя для TG-инвойса
  description: string;// описание в инвойсе
  amount: number;     // Stars (сумма)
  stars: number;      // alias (некоторый код ждёт stars)
  days: number;       // длительность
};

type PriceMap = Record<Plan, PricingItem>;

/** -------------------------
 *  Цены (по заданию)
 *  ------------------------- */
const DAYS = { WEEK: 7, MONTH: 30, HALF: 180, HALF_YEAR: 180, YEAR: 365 } as const;

export const PRICES_PRO: PriceMap = {
  WEEK:      { label: 'Неделя',     title: 'LiveManager Pro — Неделя',     description: 'Доступ на 7 дней',    amount: 59,   stars: 59,   days: DAYS.WEEK },
  MONTH:     { label: 'Месяц',      title: 'LiveManager Pro — Месяц',      description: 'Доступ на 30 дней',   amount: 199,  stars: 199,  days: DAYS.MONTH },
  HALF:      { label: 'Полгода',    title: 'LiveManager Pro — Полгода',    description: 'Доступ на 180 дней',  amount: 999,  stars: 999,  days: DAYS.HALF },
  HALF_YEAR: { label: 'Полгода',    title: 'LiveManager Pro — Полгода',    description: 'Доступ на 180 дней',  amount: 999,  stars: 999,  days: DAYS.HALF_YEAR },
  YEAR:      { label: 'Год',        title: 'LiveManager Pro — Год',        description: 'Доступ на 365 дней',  amount: 1799, stars: 1799, days: DAYS.YEAR },
};

export const PRICES_PROPLUS: PriceMap = {
  WEEK:      { label: 'Неделя',     title: 'LiveManager Pro+ — Неделя',     description: 'Доступ на 7 дней',    amount: 129,  stars: 129,  days: DAYS.WEEK },
  MONTH:     { label: 'Месяц',      title: 'LiveManager Pro+ — Месяц',      description: 'Доступ на 30 дней',   amount: 399,  stars: 399,  days: DAYS.MONTH },
  HALF:      { label: 'Полгода',    title: 'LiveManager Pro+ — Полгода',    description: 'Доступ на 180 дней',  amount: 1999, stars: 1999, days: DAYS.HALF },
  HALF_YEAR: { label: 'Полгода',    title: 'LiveManager Pro+ — Полгода',    description: 'Доступ на 180 дней',  amount: 1999, stars: 1999, days: DAYS.HALF_YEAR },
  YEAR:      { label: 'Год',        title: 'LiveManager Pro+ — Год',        description: 'Доступ на 365 дней',  amount: 3499, stars: 3499, days: DAYS.YEAR },
};

/** Новая точка входа — получаем прайс по tier */
export function getPrices(tier: Tier): PriceMap {
  return tier === 'proplus' ? PRICES_PROPLUS : PRICES_PRO;
}

/** Бейджики для UI */
export const planBadges: Record<Tier, { text: string; className: string }> = {
  pro:     { text: 'Pro',  className: 'badge' },
  proplus: { text: 'Pro+', className: 'badge badge--gold' },
};

/** Разбор плана (строка -> enum) */
export function resolvePlan(p: string | null | undefined): Plan {
  const s = String(p || '').toUpperCase();
  if (s === 'WEEK') return 'WEEK';
  if (s === 'MONTH') return 'MONTH';
  if (s === 'HALF' || s === 'HALF_YEAR') return 'HALF';
  if (s === 'YEAR') return 'YEAR';
  return 'MONTH';
}

/** Разбор тира (строка -> enum) */
export function resolveTier(t: string | null | undefined): Tier {
  const s = String(t || '').toLowerCase();
  return s === 'proplus' || s === 'pro+' ? 'proplus' : 'pro';
}

/** -------- Обратная совместимость ---------
 * Старые места импортируют PRICES (без тира).
 * Экспортируем PRICES как Pro, чтобы ничего не упало.
 */
export const PRICES = PRICES_PRO;
export type PlanInput = Plan;
