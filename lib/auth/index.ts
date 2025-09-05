// lib/auth/index.ts
// Универсальный помощник: извлекает telegramId из Request
// приоритет: заголовок -> initData -> query-параметр
import { NextRequest } from 'next/server';

export async function getTelegramId(req: NextRequest): Promise<string> {
  // 1) Спец-заголовок (прокидывается прокси/ботом)
  const direct = req.headers.get('x-telegram-id');
  if (direct && String(direct).trim()) return String(direct).trim();

  // 2) WebApp initData (прокидывай целиком в заголовок x-init-data)
  const initData = req.headers.get('x-init-data') || '';
  if (initData) {
    try {
      const p = new URLSearchParams(initData);
      const userStr = p.get('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const id = user?.id ? String(user.id) : null;
      if (id) return id;
    } catch {}
  }

  // 3) query ?userId=
  const url = new URL(req.url);
  const q = url.searchParams.get('userId');
  if (q && String(q).trim()) return String(q).trim();

  throw new Error('TELEGRAM_ID_NOT_FOUND');
}
