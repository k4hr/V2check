export type Plan = 'WEEK'|'MONTH'|'HALF'|'YEAR';
const DAY = 86400000;
const DAYS: Record<Plan, number> = { WEEK:7, MONTH:30, HALF:182, YEAR:365 };

export function getSub(): { expiresAt?: number }{
  if (typeof window==='undefined') return {};
  try{ return JSON.parse(localStorage.getItem('sub')||'{}'); }catch{ return {}; }
}
export function isPro(): boolean {
  const s = getSub(); return !!s.expiresAt && s.expiresAt > Date.now();
}
export function applyPlan(plan: Plan){
  const addDays = DAYS[plan] ?? DAYS.MONTH;
  const now = Date.now();
  const cur = getSub();
  const base = cur.expiresAt && cur.expiresAt > now ? cur.expiresAt : now;
  const expiresAt = base + addDays*DAY;
  try{ localStorage.setItem('sub', JSON.stringify({expiresAt})); }catch{}
}
