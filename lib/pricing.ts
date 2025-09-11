// lib/pricing.ts
// Единый прайсинг (сервер/клиент). Поле `stars` — алиас для старого кода.

export type Plan = 'WEEK' | 'MONTH' | 'HALF' | 'HALF_YEAR' | 'YEAR';

export type PricingItem = {
  label: string;       // короткое имя тарифа
  title: string;       // заголовок для инвойса
  description: string; // описание для инвойса
  amount: number;      // цена в Stars (XTR)
  stars: number;       // алиас для совместимости
  days: number;        // длительность в днях
};

// Полугодовой тариф (фикс: 180 дней)
const HALFY: PricingItem = {
  label: 'Полгода',
  title: 'Juristum Pro — Полгода',
  description: 'Доступ на 180 дней',
  amount: 499,
  stars: 499,
  days: 180,
};

export const PRICES: Record<Plan, PricingItem> = {
  WEEK: {
    label: 'Неделя',
    title: 'Juristum Pro — Неделя',
    description: 'Доступ на 7 дней',
    amount: 29,
    stars: 29,
    days: 7,
  },
  MONTH: {
    label: 'Месяц',
    title: 'Juristum Pro — Месяц',
    description: 'Доступ на 30 дней',
    amount: 99,
    stars: 99,
    days: 30,
  },
  HALF_YEAR: HALFY,
  HALF: HALFY, // алиас для обратной совместимости
  YEAR: {
    label: 'Год',
    title: 'Juristum Pro — Год',
    description: 'Доступ на 365 дней',
    amount: 899,
    stars: 899,
    days: 365,
  },
} as const;

export type PlanInput = keyof typeof PRICES;

export function resolvePlan(plan: string | null | undefined): Plan {
  const k = String(plan || '').toUpperCase() as Plan;
  return (k in PRICES) ? k : 'MONTH';
}
