// v2check/lib/pricing.ts
/**
 * Единый источник правды для тарифов (сервер).
 * Клиентский файл `app/lib/pricing.ts` делает просто реэкспорт.
 *
 * Важно: добавлен алиас 'HALF' => 'HALF_YEAR', чтобы не ломать уже существующие вызовы.
 * Значения ниже — примеры. Подставь ваши финальные цены/длительности, если они другие.
 */

export type Plan = 'WEEK' | 'MONTH' | 'HALF' | 'HALF_YEAR' | 'YEAR';

export type PricingItem = {
  label: string;       // короткое имя для UI
  title: string;       // заголовок invoice
  description: string; // описание в invoice
  amount: number;      // цена в Stars
  days: number;        // кол-во дней доступа
};

// Базовая запись для полугода
const HALF_YEAR_ITEM: PricingItem = {
  label: 'Полгода',
  title: 'Juristum Pro — Полгода',
  description: 'Доступ на 180 дней',
  amount: 499,
  days: 180,
};

export const PRICES: Record<Plan, PricingItem> = {
  WEEK: {
    label: 'Неделя',
    title: 'Juristum Pro — Неделя',
    description: 'Доступ на 7 дней',
    amount: 29,
    days: 7,
  },
  MONTH: {
    label: 'Месяц',
    title: 'Juristum Pro — Месяц',
    description: 'Доступ на 30 дней',
    amount: 99,
    days: 30,
  },
  HALF_YEAR: HALF_YEAR_ITEM,
  HALF: HALF_YEAR_ITEM, // алиас на тот же план (совместимость со старым клиентом)
  YEAR: {
    label: 'Год',
    title: 'Juristum Pro — Год',
    description: 'Доступ на 365 дней',
    amount: 899,
    days: 365,
  },
} as const;

export type PlanInput = keyof typeof PRICES;

export function resolvePlan(plan: string | null | undefined): Plan {
  const key = String(plan || '').toUpperCase() as Plan;
  if (key in PRICES) return key;
  // по умолчанию — Месяц
  return 'MONTH';
}
