// lib/pricing.ts

// БАЗОВЫЕ ТИПЫ (как было)
export type Tier = 'PRO' | 'PROPLUS';
export type Plan = 'WEEK' | 'MONTH' | 'HALF_YEAR' | 'YEAR';

export type PricingItem = {
  label: string;
  title: string;
  description: string;
  amount: number;  // Stars (минорные единицы внутри Telegram)
  stars: number;   // alias
  days: number;    // 7/30/180/365
};

// СУТКИ В ДНЯХ (как было)
const DAYS = { WEEK: 7, MONTH: 30, HALF_YEAR: 180, YEAR: 365 } as const;

// ЦЕНЫ В STARS (как было, не трогаем)
export const PRICES: Record<Tier, Record<Plan, PricingItem>> = {
  PRO: {
    WEEK:      { label:'Неделя',  title:'LiveManager Pro — Неделя',  description:'Доступ на 7 дней',   amount:129,  stars:129,  days:DAYS.WEEK },
    MONTH:     { label:'Месяц',   title:'LiveManager Pro — Месяц',   description:'Доступ на 30 дней',  amount:399,  stars:399,  days:DAYS.MONTH },
    HALF_YEAR: { label:'Полгода', title:'LiveManager Pro — Полгода', description:'Доступ на 180 дней', amount:1999, stars:1999, days:DAYS.HALF_YEAR },
    YEAR:      { label:'Год',     title:'LiveManager Pro — Год',     description:'Доступ на 365 дней', amount:3499, stars:3499, days:DAYS.YEAR },
  },
  PROPLUS: {
    WEEK:      { label:'Неделя',  title:'LiveManager Pro+ — Неделя',  description:'Доступ на 7 дней',   amount:249,  stars:249,  days:DAYS.WEEK },
    MONTH:     { label:'Месяц',   title:'LiveManager Pro+ — Месяц',   description:'Доступ на 30 дней',  amount:749,  stars:749,  days:DAYS.MONTH },
    HALF_YEAR: { label:'Полгода', title:'LiveManager Pro+ — Полгода', description:'Доступ на 180 дней', amount:3699, stars:3699, days:DAYS.HALF_YEAR },
    YEAR:      { label:'Год',     title:'LiveManager Pro+ — Год',     description:'Доступ на 365 дней', amount:6499, stars:6499, days:DAYS.YEAR },
  },
} as const;

// ---------- ДОБАВЛЕНО ДЛЯ ВК (РУБЛИ) ----------
// Чтобы не лезть в конвертацию Stars→RUB и не плодить зависимостей,
// задаём фиксированные цены для VK в РУБЛЯХ (в КОПЕЙКАХ — целые числа).
// По умолчанию они совпадают по цифре со Stars (399 Stars → 399 ₽),
// можно скорректировать через ENV (см. ниже).

// Базовые RUB-цены (КОПЕЙКИ), по умолчанию равные числу Stars * 100.
const VK_RUB_BASE: Record<Tier, Record<Plan, number>> = {
  PRO: {
    WEEK:      12900,
    MONTH:     39900,
    HALF_YEAR: 199900,
    YEAR:      349900,
  },
  PROPLUS: {
    WEEK:      24900,
    MONTH:     74900,
    HALF_YEAR: 369900,
    YEAR:      649900,
  },
} as const;

// Переопределения цен из ENV (копейки).
// Пример: NEXT_PUBLIC_PRICE_RUB_PRO_MONTH=45900
function envRubOverride(tier: Tier, plan: Plan): number | null {
  const key = `NEXT_PUBLIC_PRICE_RUB_${tier}_${plan}`;
  const raw = (process.env as any)?.[key];
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : null;
}

// Итоговые цены VK в копейках (учитывают ENV-override).
export function getVkRubKopecks(tier: Tier): Record<Plan, number> {
  return {
    WEEK:      envRubOverride(tier, 'WEEK')      ?? VK_RUB_BASE[tier].WEEK,
    MONTH:     envRubOverride(tier, 'MONTH')     ?? VK_RUB_BASE[tier].MONTH,
    HALF_YEAR: envRubOverride(tier, 'HALF_YEAR') ?? VK_RUB_BASE[tier].HALF_YEAR,
    YEAR:      envRubOverride(tier, 'YEAR')      ?? VK_RUB_BASE[tier].YEAR,
  };
}

// Удобный геттер для одной пары (tier, plan)
export function getVkRubKopecksOne(tier: Tier, plan: Plan): number {
  return getVkRubKopecks(tier)[plan];
}

// Универсальный селектор цены под платформу.
// platform: 'TG' → Stars (XTR), 'VK' → RUB (копейки).
export function getPriceFor(
  tier: Tier,
  plan: Plan,
  platform: 'TG' | 'VK'
): { amount: number; currency: 'XTR' | 'RUB'; days: number; label: string; title: string; description: string } {
  const base = PRICES[tier][plan];
  if (platform === 'VK') {
    return {
      amount: getVkRubKopecksOne(tier, plan), // копейки
      currency: 'RUB',
      days: base.days,
      label: base.label,
      title: base.title,
      description: base.description,
    };
  }
  // TG / Stars
  return {
    amount: base.stars, // Stars
    currency: 'XTR',
    days: base.days,
    label: base.label,
    title: base.title,
    description: base.description,
  };
}

// ---------- СТАРЫЕ ВСПОМОГАТЕЛЬНЫЕ (как было) ----------
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
