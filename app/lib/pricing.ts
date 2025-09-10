// app/lib/pricing.ts
// Клиент видит те же PRICES, что и сервер — без дублирования.
export {
  PRICES,
  type Plan,
  type PricingItem,
  type PlanInput,
  resolvePlan,
} from '@/lib/pricing';
