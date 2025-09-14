// lib/auth/verifyInitData.ts
import crypto from 'node:crypto';

/**
 * Строим секрет по правилам Telegram Mini Apps:
 * secret = HMAC_SHA256(key="WebAppData", data=BOT_TOKEN)
 */
function buildSecret(botToken: string): Buffer {
  const serviceKey = Buffer.from('WebAppData', 'utf8');
  return crypto.createHmac('sha256', serviceKey).update(botToken).digest();
}

/**
 * Собираем Data Check String:
 *  - берём все пары кроме `hash`
 *  - сортируем по ключу в алфавитном порядке
 *  - склеиваем `key=value` через \n
 */
function buildDataCheckString(params: URLSearchParams): string {
  const pairs: string[] = [];
  params.forEach((value, key) => {
    if (key === 'hash') return;
    pairs.push(`${key}=${value}`);
  });
  pairs.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return pairs.join('\n');
}

/**
 * ВАЛИДАЦИЯ initData — строго boolean.
 */
export function verifyInitData(initData: string, botToken: string): boolean {
  try {
    if (!initData || !botToken) return false;

    const params = new URLSearchParams(initData);
    const gotHash = params.get('hash');
    if (!gotHash) return false;

    const dcs = buildDataCheckString(params);
    const secret = buildSecret(botToken);
    const expected = crypto.createHmac('sha256', secret).update(dcs).digest('hex');

    // сравнение в постоянном времени
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(gotHash, 'hex'),
    );
  } catch {
    return false;
  }
}

/**
 * Возвращает Telegram ID как строку или null (без исключений).
 */
export function getTelegramId(initData: string): string | null {
  try {
    const params = new URLSearchParams(initData);
    const userStr = params.get('user');
    if (!userStr) return null;
    const user = JSON.parse(userStr) as { id?: number | string };
    if (!user || typeof user.id === 'undefined' || user.id === null) return null;
    return String(user.id);
  } catch {
    return null;
  }
}

/**
 * Жёсткая версия: бросает, если ID не найден.
 */
export function getTelegramIdStrict(initData: string): string {
  const id = getTelegramId(initData);
  if (!id) throw new Error('NO_TELEGRAM_ID');
  return id;
}

/**
 * Аккуратно достаём initData из запроса:
 * 1) заголовок x-init-data
 * 2) query ?initData=
 * (body намеренно НЕ читаем — чтобы не ловить ошибки/parsing при пустом теле)
 */
export function getInitDataFrom(req: Request): string {
  // @ts-expect-error — в NextRequest есть .headers и .url как у Fetch Request
  const hdr = req.headers?.get?.('x-init-data') as string | null;
  if (hdr) return hdr;
  // @ts-expect-error — в NextRequest есть .url
  const url = new URL(req.url);
  return url.searchParams.get('initData') || '';
}

// --- Backward‑compat aliases ---
/** Старое имя, часто встречается в проекте. */
export function extractTelegramId(initData: string): string {
  return getTelegramId(initData) || '';
}
/** Для совместимости с импортами вида { getInitData } */
export function getInitData(req: Request): string {
  return getInitDataFrom(req);
}
