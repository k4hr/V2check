// lib/pricing.ts

export type Tier = 'PRO' | 'PROPLUS';
export type Plan = 'WEEK' | 'MONTH' | 'HALF_YEAR' | 'YEAR';

export type PricingItem = {
  label: string;
  title: string;
  description: string;
  amount: number;  // Stars
  stars: number;   // alias
  days: number;    // 7/30/180/365
};

const DAYS = { WEEK: 7, MONTH: 30, HALF_YEAR: 180, YEAR: 365 } as const;

export const PRICES: Record<Tier, Record<Plan, PricingItem>> = {
  PRO: {
    WEEK:      { label:'Неделя',  title:'LiveManager Pro — Неделя',  description:'Доступ на 7 дней',   amount:59,   stars:59,   days:DAYS.WEEK },
    MONTH:     { label:'Месяц',   title:'LiveManager Pro — Месяц',   description:'Доступ на 30 дней',  amount:199,  stars:199,  days:DAYS.MONTH },
    HALF_YEAR: { label:'Полгода', title:'LiveManager Pro — Полгода', description:'Доступ на 180 дней', amount:999,  stars:999,  days:DAYS.HALF_YEAR },
    YEAR:      { label:'Год',     title:'LiveManager Pro — Год',     description:'Доступ на 365 дней', amount:1799, stars:1799, days:DAYS.YEAR },
  },
  PROPLUS: {
    WEEK:      { label:'Неделя',  title:'LiveManager Pro+ — Неделя',  description:'Доступ на 7 дней',   amount:129,  stars:129,  days:DAYS.WEEK },
    MONTH:     { label:'Месяц',   title:'LiveManager Pro+ — Месяц',   description:'Доступ на 30 дней',  amount:399,  stars:399,  days:DAYS.MONTH },
    HALF_YEAR: { label:'Полгода', title:'LiveManager Pro+ — Полгода', description:'Доступ на 180 дней', amount:1999, stars:1999, days:DAYS.HALF_YEAR },
    YEAR:      { label:'Год',     title:'LiveManager Pro+ — Год',     description:'Доступ на 365 дней', amount:3499, stars:3499, days:DAYS.YEAR },
  },
} as const;

export function resolveTier(t: string | null | undefined): Tier {
  const s = String(t || '').toUpperCase();
  return s === 'PROPLUS' || s === 'PLUS' || s === 'MAX' ? 'PROPLUS' : 'PRO';
}

export function resolvePlan(p: string | null | undefined): Plan {
  const s = String(p || '').toUpperCase();
  return (s === 'WEEK' || s === 'MONTH' || s === 'HALF_YEAR' || s === 'YEAR') ? (s as Plan) : 'MONTH';
}

export function getPrices(tier: Tier): Record<Plan, PricingItem> {
  return PRICES[tier];
}

export function planBadges(tier: Tier, plan: Plan): { text: string; className: string }[] {
  const arr: { text: string; className: string }[] = [];
  if (plan === 'MONTH') arr.push({ text: 'популярно', className: tier === 'PROPLUS' ? 'badge badge--gold' : 'badge' });
  if (plan === 'YEAR')  arr.push({ text: 'выгодно',   className: tier === 'PROPLUS' ? 'badge badge--gold' : 'badge' });
  return arr;
}
