// lib/pricing.ts
export type Tier = 'PRO' | 'PRO_PLUS';

export type Plan = 'WEEK' | 'MONTH' | 'HALF_YEAR' | 'YEAR';

export type PricingItem = {
  label: string;       // «Неделя», «Месяц», …
  title: string;       // Заголовок инвойса
  description: string; // Описание инвойса
  amount: number;      // Stars
  stars: number;       // alias для совместимости с Telegram API
  days: number;        // длительность
};

/** ---------- PRO (базовый) ---------- */
export const PRICES_PRO: Record<Plan, PricingItem> = {
  WEEK: {
    label: 'Неделя',
    title: 'LiveManager Pro — Неделя',
    description: 'Доступ на 7 дней',
    amount: 59,
    stars: 59,
    days: 7,
  },
  MONTH: {
    label: 'Месяц',
    title: 'LiveManager Pro — Месяц',
    description: 'Доступ на 30 дней',
    amount: 199,
    stars: 199,
    days: 30,
  },
  HALF_YEAR: {
    label: 'Полгода',
    title: 'LiveManager Pro — Полгода',
    description: 'Доступ на 180 дней',
    amount: 999,
    stars: 999,
    days: 180,
  },
  YEAR: {
    label: 'Год',
    title: 'LiveManager Pro — Год',
    description: 'Доступ на 365 дней',
    amount: 1799,
    stars: 1799,
    days: 365,
  },
} as const;

/** ---------- PRO+ (усиленный) ---------- */
export const PRICES_PRO_PLUS: Record<Plan, PricingItem> = {
  WEEK: {
    label: 'Неделя',
    title: 'LiveManager Pro+ — Неделя',
    description: 'Доступ на 7 дней',
    amount: 129,
    stars: 129,
    days: 7,
  },
  MONTH: {
    label: 'Месяц',
    title: 'LiveManager Pro+ — Месяц',
    description: 'Доступ на 30 дней',
    amount: 399,
    stars: 399,
    days: 30,
  },
  HALF_YEAR: {
    label: 'Полгода',
    title: 'LiveManager Pro+ — Полгода',
    description: 'Доступ на 180 дней',
    amount: 1999,
    stars: 1999,
    days: 180,
  },
  YEAR: {
    label: 'Год',
    title: 'LiveManager Pro+ — Год',
    description: 'Доступ на 365 дней',
    amount: 3499,
    stars: 3499,
    days: 365,
  },
} as const;

/** Легаси: оставить PRICES = PRO, чтобы старые импорты не падали */
export const PRICES = PRICES_PRO;

/** Нормализация плана из строки (учтены старые алиасы типа HALF) */
const PLAN_ALIASES: Record<string, Plan> = { HALF: 'HALF_YEAR' };

export function resolvePlan(plan: string | null | undefined): Plan {
  const raw = String(plan || '').toUpperCase();
  if ((PRICES_PRO as any)[raw]) return raw as Plan;
  if (PLAN_ALIASES[raw]) return PLAN_ALIASES[raw];
  return 'MONTH';
}

/** Нормализация тира. Понимает: min/pro -> PRO, max/pro+ -> PRO_PLUS */
export function resolveTier(input: string | null | undefined): Tier {
  const s = String(input || '').toLowerCase();
  if (['pro', 'min', 'basic', 'lite'].includes(s)) return 'PRO';
  if (['pro+', 'proplus', 'plus', 'max'].includes(s)) return 'PRO_PLUS';
  return 'PRO'; // по умолчанию
}

/** Вернуть набор цен по тирy */
export function getPrices(tier: Tier): Record<Plan, PricingItem> {
  return tier === 'PRO_PLUS' ? PRICES_PRO_PLUS : PRICES_PRO;
}

/** Бэйджи для кнопок планов (UI helper) */
export function planBadges(
  tier: Tier,
  plan: Plan
): { text: string; className: string }[] {
  const badges: { text: string; className: string }[] = [];

  // Бэйдж тира
  badges.push({
    text: tier === 'PRO_PLUS' ? 'Pro+' : 'Pro',
    className: tier === 'PRO_PLUS' ? 'badge badge--gold' : 'badge',
  });

  // Пример бэйджа выгоды (можно расширить логику)
  if (plan === 'YEAR') {
    badges.push({
      text: 'лучшая цена',
      className: 'badge badge--deal',
    });
  }

  return badges;
}
