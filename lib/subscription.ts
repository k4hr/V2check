// lib/subscription.ts
// Хелперы подписки: проверка PRO, форматирование, безопасные проверки.

export type UserLike = {
  subscriptionUntil?: string | Date | null;
};

/** Есть активная подписка? (аргумент опционален для обратной совместимости) */
export function isPro(user?: UserLike | null): boolean {
  if (!user?.subscriptionUntil) return false;
  const until = new Date(user.subscriptionUntil);
  if (Number.isNaN(until.getTime())) return false;
  return until.getTime() > Date.now();
}

/** Красиво отобразить "Подписка до …" */
export function formatUntil(user?: UserLike | null): string | null {
  if (!isPro(user)) return null;
  const d = new Date(user!.subscriptionUntil as any);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

/** Возвращает миллисекунд до истечения или null */
export function msLeft(user?: UserLike | null): number | null {
  if (!isPro(user)) return null;
  const until = new Date(user!.subscriptionUntil as any).getTime();
  return Math.max(0, until - Date.now());
}
