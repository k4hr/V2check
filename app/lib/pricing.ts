export type Plan = 'WEEK'|'MONTH'|'HALF'|'YEAR';

export const PRICES: Record<Plan, { label: string; title: string; amount: number; days: number }> = {
  WEEK:  { label: 'Неделя',  title: 'Juristum Pro — Неделя',  amount: 29,  days: 7 },
  MONTH: { label: 'Месяц',   title: 'Juristum Pro — Месяц',   amount: 99,  days: 30 },
  HALF:  { label: 'Полгода', title: 'Juristum Pro — Полгода', amount: 499, days: 182 },
  YEAR:  { label: 'Год',     title: 'Juristum Pro — Год',     amount: 899, days: 365 },
};
