import type { NextRequest } from 'next/server';

export type TgUser = {
  id: number | string;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  photo_url?: string | null;
};

export function parseTgUser(req: NextRequest): TgUser | null {
  // 1) Заголовок "x-telegram-user" (JSON)
  const hdr = req.headers.get('x-telegram-user');
  if (hdr) {
    try { return JSON.parse(hdr) as TgUser; } catch {}
  }

  // 2) Кука "tg_user" (JSON)
  try {
    const cookie = req.cookies.get('tg_user')?.value;
    if (cookie) return JSON.parse(cookie) as TgUser;
  } catch {}

  // 3) Параметр запроса ?tid=123 (fallback для теста)
  const tid = req.nextUrl.searchParams.get('tid');
  if (tid) return { id: tid };

  return null;
}

export function getTelegramIdStrict(req: NextRequest): string {
  const u = parseTgUser(req);
  if (!u?.id) throw new Error('NO_TELEGRAM_ID');
  return String(u.id);
}
