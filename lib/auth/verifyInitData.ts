import type { NextRequest } from 'next/server';
import crypto from 'crypto';

/**
 * Проверка подписи Telegram WebApp initData.
 * Документация: https://core.telegram.org/bots/webapps#validating-data-received-via-the-web-app
 */
export function verifyInitData(initData: string, botToken: string) {
  if (!initData) {
    return { ok: false, error: 'EMPTY_INIT_DATA' as const };
  }
  if (!botToken) {
    return { ok: false, error: 'EMPTY_BOT_TOKEN' as const };
  }

  const params = new URLSearchParams(initData);
  const hash = params.get('hash') || '';
  params.delete('hash');

  // Формируем проверочную строку
  const dataCheckString = Array.from(params.entries())
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n');

  // Секрет = HMAC_SHA256("WebAppData", botToken)
  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();

  // HMAC_SHA256(data_check_string, secret)
  const sign = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');

  if (sign !== hash) {
    return { ok: false, error: 'BAD_SIGNATURE' as const };
  }

  // Парсим полезные поля
  const userJson = params.get('user');
  const auth_date = params.get('auth_date') ? Number(params.get('auth_date')) : undefined;

  let user: any = undefined;
  try {
    if (userJson) user = JSON.parse(userJson);
  } catch {
    // игнор
  }

  const telegramId = user?.id ? String(user.id) : undefined;

  return {
    ok: true as const,
    payload: { user, auth_date },
    data: { telegramId, user, auth_date },
  };
}

/**
 * Утилита для API-роутов Next.js: достать telegramId из запроса.
 * Берёт initData из:
 *  - заголовка 'x-telegram-init-data', или
 *  - query ?initData=..., или
 *  - cookie 'tg_init_data'
 * На время локальных/Railway-тестов поддерживает заголовок 'x-telegram-id'.
 */
export async function getTelegramId(req: NextRequest): Promise<string> {
  const testId = req.headers.get('x-telegram-id');
  if (testId) return String(testId);

  const initData =
    req.headers.get('x-telegram-init-data') ??
    req.nextUrl.searchParams.get('initData') ??
    req.cookies.get('tg_init_data')?.value ??
    '';

  const BOT_TOKEN = process.env.TG_BOT_TOKEN || process.env.BOT_TOKEN || '';
  const v = verifyInitData(String(initData), String(BOT_TOKEN));

  if (!v.ok || !v.data?.telegramId) {
    throw new Error('UNAUTHORIZED');
  }
  return String(v.data.telegramId);
}
