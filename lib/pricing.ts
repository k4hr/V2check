// lib/pricing.ts

export type Plan = 'WEEK' | 'MONTH' | 'HALF_YEAR' | 'YEAR';
export type Tier = 'pro' | 'proplus';

export type PricingItem = {
  label: string;       // коротко: Неделя, Месяц, ...
  title: string;       // полное отображаемое: LiveManager Pro — Месяц
  description: string; // подсказка
  amount: number;      // ⭐ Stars, целое число
  stars: number;       // alias для совместимости
  days: number;
};

// --- Pro (min) 59 / 199 / 999 / 1799 ---
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
};

// --- Pro+ (max) 129 / 399 / 1999 / 3499 ---
export const PRICES_PROPLUS: Record<Plan, PricingItem> = {
  WEEK: {
    label: 'Неделя',
    title: 'LiveManager Pro+ — Неделя',
    description: 'Пробный доступ на 7 дней',
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
};

// --- Хелперы выбора и бейджи ---

export function resolvePlan(plan: string | null | undefined): Plan {
  const k = String(plan || '').toUpperCase();
  return (['WEEK', 'MONTH', 'HALF_YEAR', 'YEAR'] as Plan[]).includes(k as Plan)
    ? (k as Plan)
    : 'MONTH';
}

export function resolveTier(tier: string | null | undefined): Tier {
  const t = String(tier || '').toLowerCase();
  return (t === 'proplus') ? 'proplus' : 'pro';
}

export function getPrices(tier: Tier): Record<Plan, PricingItem> {
  return tier === 'proplus' ? PRICES_PROPLUS : PRICES_PRO;
}

// Расчёт «скидки» относительно помесячной оплаты
export function discountLabelMonthly(baseMonthly: number, target: number, months: number): string | null {
  if (!baseMonthly || !months) return null;
  const full = baseMonthly * months;
  if (target >= full) return null;
  const pct = Math.round(((full - target) / full) * 100);
  return pct > 0 ? `–${pct}%` : null;
}

// Рекомендации для бейджей
export function planBadges(tier: Tier, plan: Plan): string[] {
  const prices = getPrices(tier);
  const monthly = prices.MONTH.amount;
  if (plan === 'MONTH') return ['Лучший выбор'];
  if (plan === 'HALF_YEAR') {
    const lbl = discountLabelMonthly(monthly, prices.HALF_YEAR.amount, 6);
    return lbl ? [lbl] : [];
  }
  if (plan === 'YEAR') {
    const lbl = discountLabelMonthly(monthly, prices.YEAR.amount, 12);
    return lbl ? [lbl] : [];
  }
  if (plan === 'WEEK') return ['Пробный'];
  return [];
}
