// lib/auth/verifyInitData.ts
import type { NextRequest } from 'next/server';
import crypto from 'crypto';

/** Валидация Telegram WebApp initData (см. офиц. доку) */
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

/** Универсально достаём telegramId из запроса */
export async function getTelegramId(req: NextRequest): Promise<string> {
  // Для локальных/пробных вызовов можно передать заголовок x-telegram-id
  const testId = req.headers.get('x-telegram-id');
  if (testId) return String(testId);

  const initData =
    req.headers.get('x-telegram-init-data') ??
    req.nextUrl.searchParams.get('initData') ??
    req.cookies.get('tg_init_data')?.value ??
    '';

  const BOT_TOKEN = process.env.TG_BOT_TOKEN || process.env.BOT_TOKEN || '';
  const v = verifyInitData(String(initData), String(BOT_TOKEN));

  if (!v.ok || !v.data?.telegramId) throw new Error('UNAUTHORIZED');
  return String(v.data.telegramId);
}
