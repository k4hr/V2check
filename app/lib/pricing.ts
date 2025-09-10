// app/lib/pricing.ts
// Клиентский слой: явный реэкспорт серверных констант/типов.
// Это устраняет ошибку импорта PRICES из ../lib/pricing в app/pro/page.tsx.
export {
  PRICES,
  type Plan,
  type PricingItem,
  type PlanInput,
  resolvePlan,
} from '@/lib/pricing';
