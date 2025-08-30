export type Plan = 'WEEK'|'MONTH'|'HALF'|'YEAR';

export type PricingItem = {
  label: string;
  title: string;
  description: string;
  amount: number;
  days: number;
};

export const PRICES: Record<Plan, PricingItem> = {
  WEEK:  { label: 'Неделя',  title: 'Juristum Pro — Неделя',  description: 'Доступ на 7 дней',   amount: 29,  days: 7 },
  MONTH: { label: 'Месяц',   title: 'Juristum Pro — Месяц',   description: 'Доступ на 30 дней',  amount: 99,  days: 30 },
  HALF:  { label: 'Полгода', title: 'Juristum Pro — Полгода', description: 'Доступ на 182 дня',  amount: 499, days: 182 },
  YEAR:  { label: 'Год',     title: 'Juristum Pro — Год',     description: 'Доступ на 365 дней', amount: 899, days: 365 },
};
