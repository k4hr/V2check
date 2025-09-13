// lib/auth/verifyInitData.ts
// Верификация initData Telegram WebApp и утилиты для извлечения telegramId.

import crypto from 'node:crypto';

/**
 * Формирует секрет по правилам Telegram:
 * secret = HMAC_SHA256(key="WebAppData", message=BOT_TOKEN)
 */
function getSecret(botToken: string): Buffer {
  return crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
}

/**
 * Строит строку data_check_string:
 * Берём все пары key=value (кроме hash), сортируем по ключу и соединяем \n
 */
function buildDataCheckString(initData: string): string {
  const urlParams = new URLSearchParams(initData);
  const pairs: string[] = [];

  for (const [k, v] of urlParams.entries()) {
    if (k === 'hash') continue;
    pairs.push(`${k}=${v}`);
  }
  pairs.sort();
  return pairs.join('\n');
}

/**
 * Проверка подписи initData.
 * Возвращает true/false, без исключений.
 */
export function verifyInitData(initData: string, botToken: string): boolean {
  try {
    if (!initData || !botToken) return false;

    const urlParams = new URLSearchParams(initData);
    const theirHash = urlParams.get('hash');
    if (!theirHash) return false;

    const data = buildDataCheckString(initData);
    const secret = getSecret(botToken);

    const expected = crypto.createHmac('sha256', secret).update(data).digest('hex');

    // Тайминг-безопасное сравнение
    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(theirHash, 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Пытается достать telegramId (как строку) из initData.
 * Возвращает null, если не удалось.
 */
export function getTelegramId(initData: string): string | null {
  try {
    const urlParams = new URLSearchParams(initData);
    const userRaw = urlParams.get('user');
    if (!userRaw) return null;

    // user — это JSON-строка с объектом пользователя
    const user = JSON.parse(userRaw) as { id?: number | string } | null;
    if (!user || user.id == null) return null;

    return String(user.id);
  } catch {
    return null;
  }
}

/**
 * Жёсткая версия: бросает ошибку, если id не извлечён.
 */
export function getTelegramIdStrict(initData: string): string {
  const id = getTelegramId(initData);
  if (!id) throw new Error('TELEGRAM_ID_NOT_FOUND');
  return id;
}
