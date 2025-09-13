// lib/auth/index.ts — Минимум для сборки вебхука/избранного.
// Позже можно заменить на полноценную HMAC-проверку.

export function getTelegramIdStrict(initData: string | null | undefined): string {
  const raw = String(initData || '');
  const sp = new URLSearchParams(raw);
  const userStr = sp.get('user');
  if (!userStr) throw new Error('No Telegram user in initData');
  let user: any = null;
  try { user = JSON.parse(userStr); } catch {}
  const id = user?.id ?? user?.user?.id;
  if (!id) throw new Error('No Telegram user.id in initData');
  return String(id);
}

export function verifyInitData(_initData: string): boolean {
  return true; // TODO: заменить на HMAC-проверку по BOT_TOKEN
}
