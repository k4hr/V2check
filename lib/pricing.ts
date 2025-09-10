// lib/pricing.ts
// Единый источник тарифов для сервера. Клиент реэкспортит из app/lib/pricing.ts.
// Добавлено поле `stars` как алиас `amount`, чтобы не менять существующий код.
// Добавлен алиас плана 'HALF' -> 'HALF_YEAR' (обе записи ссылаются на один объект).

export type Plan = 'WEEK' | 'MONTH' | 'HALF' | 'HALF_YEAR' | 'YEAR';

export type PricingItem = {
  label: string;       // короткое имя для UI
  title: string;       // заголовок invoice
  description: string; // описание в invoice
  amount: number;      // цена в Stars
  stars: number;       // АЛИАС для совместимости со старым кодом
  days: number;        // длительность доступа
};

const halfYear: PricingItem = {
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
  HALF_YEAR: halfYear,
  HALF: halfYear, // алиас для совместимости с имеющимся кодом
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
  if (k in PRICES) return k;
  return 'MONTH';
}
