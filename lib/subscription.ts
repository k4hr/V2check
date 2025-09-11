// lib/subscription.ts
// Хелперы подписки: проверка PRO, форматирование, безопасные проверки.

export type UserLike = {
  subscriptionUntil?: string | Date | null;
};

/** Есть активная подписка? */
export function isPro(user: UserLike | null | undefined): boolean {
  if (!user?.subscriptionUntil) return false;
  const until = new Date(user.subscriptionUntil);
  if (Number.isNaN(until.getTime())) return false;
  return until.getTime() > Date.now();
}

/** Красиво отобразить "Подписка до …" */
export function formatUntil(user: UserLike | null | undefined): string | null {
  if (!isPro(user)) return null;
  const d = new Date(user!.subscriptionUntil as any);
  // dd.mm.yyyy
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

/** Возвращает миллисекунд до истечения или null */
export function msLeft(user: UserLike | null | undefined): number | null {
  if (!isPro(user)) return null;
  const until = new Date(user!.subscriptionUntil as any).getTime();
  return Math.max(0, until - Date.now());
}
