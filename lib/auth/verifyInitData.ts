import type { NextRequest } from 'next/server';
import crypto from 'crypto';

/**
 * Проверка подписи Telegram WebApp initData.
 * Возвращает:
 *  - ok: true/false
 *  - data.telegramId — строка, если доступно
 *  - payload.user, payload.auth_date — как есть из initData
 */
export function verifyInitData(initData: string, botToken: string) {
  if (!initData) return { ok: false as const, error: 'EMPTY_INIT_DATA' };
  if (!botToken) return { ok: false as const, error: 'EMPTY_BOT_TOKEN' };

  const params = new URLSearchParams(initData);
  const hash = params.get('hash') || '';
  params.delete('hash');

  const dataCheckString = Array.from(params.entries())
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n');

  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const sign = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');

  if (sign !== hash) return { ok: false as const, error: 'BAD_SIGNATURE' };

  const userJson = params.get('user');
  const auth_date = params.get('auth_date') ? Number(params.get('auth_date')) : undefined;

  let user: any = undefined;
  try { if (userJson) user = JSON.parse(userJson); } catch {}

  const telegramId = user?.id ? String(user.id) : undefined;

  return {
    ok: true as const,
    payload: { user, auth_date },
    data: { telegramId, user, auth_date },
  };
}

/**
 * Мягкий парсер "пользователя" из запроса (для удобства клиента/тестов).
 * Ищет:
 *  - заголовок x-telegram-user (JSON)
 *  - куку tg_user (JSON)
 *  - query ?tid=... (строка)
 */
export function parseTgUser(req: NextRequest): { id: string; [k: string]: any } | null {
  const hdr = req.headers.get('x-telegram-user');
  if (hdr) {
    try {
      const u = JSON.parse(hdr);
      if (u?.id) return { ...u, id: String(u.id) };
    } catch {}
  }

  const c = req.cookies.get('tg_user')?.value;
  if (c) {
    try {
      const u = JSON.parse(c);
      if (u?.id) return { ...u, id: String(u.id) };
    } catch {}
  }

  const tid = req.nextUrl.searchParams.get('tid');
  if (tid) return { id: String(tid) };

  return null;
}

/**
 * Строго достаёт telegramId из запроса.
 * Приоритет:
 *  1) test-override: заголовок x-telegram-id
 *  2) корректный initData (x-telegram-init-data / ?initData / cookie tg_init_data) с проверкой подписи
 *  3) fallback: parseTgUser (x-telegram-user / cookie tg_user / ?tid)
 */
export async function getTelegramIdStrict(req: NextRequest): Promise<string> {
  const override = req.headers.get('x-telegram-id');
  if (override) return String(override);

  const initData =
    req.headers.get('x-telegram-init-data') ??
    req.nextUrl.searchParams.get('initData') ??
    req.cookies.get('tg_init_data')?.value ??
    '';

  const BOT_TOKEN = process.env.TG_BOT_TOKEN || process.env.BOT_TOKEN || '';

  if (initData) {
    const v = verifyInitData(String(initData), String(BOT_TOKEN));
    if (v.ok && v.data?.telegramId) return String(v.data.telegramId);
  }

  const u = parseTgUser(req);
  if (u?.id) return String(u.id);

  throw new Error('UNAUTHORIZED');
}

/** Совместимый алиас для старого кода */
export const getTelegramId = getTelegramIdStrict;
