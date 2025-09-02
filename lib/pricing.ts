export type Plan = 'WEEK' | 'MONTH' | 'HALF_YEAR' | 'YEAR';

export const PRICES: Record<Plan, { label:string; stars:number; days:number }> = {
  WEEK:  { label:'Неделя',   stars:29,  days:7 },
  MONTH: { label:'Месяц',    stars:99,  days:30 },
  HALF_YEAR: { label:'Полгода', stars:499, days:180 },
  YEAR:  { label:'Год',      stars:899, days:365 }
};

export const PLANS_ORDER: Plan[] = ['WEEK','MONTH','HALF_YEAR','YEAR'];
