import { NextRequest } from 'next/server';

/**
 * Унифицированный способ получить telegramId пользователя.
 * Приоритет:
 * 1) x-telegram-id (кастомный заголовок)
 * 2) x-init-data (Telegram WebApp initData -> ?user=...)
 * 3) query ?userId=...
 */
export async function getTelegramId(req: NextRequest): Promise<string> {
  // 1) прямой заголовок (если прокидываешь)
  const h = req.headers.get('x-telegram-id');
  if (h && String(h).trim()) return String(h).trim();

  // 2) initData из заголовка
  const init = req.headers.get('x-init-data') || '';
  if (init) {
    try {
      const p = new URLSearchParams(init);
      const userStr = p.get('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const id = user?.id ? String(user.id) : null;
      if (id) return id;
    } catch {}
  }

  // 3) query-параметр
  const uid = req.nextUrl.searchParams.get('userId');
  if (uid) return String(uid);

  throw new Error('TELEGRAM_ID_NOT_FOUND');
}
