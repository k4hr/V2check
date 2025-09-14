// lib/auth/verifyInitData.ts
import crypto from 'node:crypto';

/** secret = HMAC_SHA256(key="WebAppData", data=BOT_TOKEN) */
function buildSecret(botToken: string): Buffer {
  const serviceKey = Buffer.from('WebAppData', 'utf8');
  return crypto.createHmac('sha256', serviceKey).update(botToken).digest();
}

/** Data Check String из всех пар (кроме hash), отсортированных по ключу */
function buildDataCheckString(params: URLSearchParams): string {
  const pairs: string[] = [];
  params.forEach((value, key) => {
    if (key === 'hash') return;
    pairs.push(`${key}=${value}`);
  });
  pairs.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return pairs.join('\n');
}

/** Строгая boolean-валидация initData */
export function verifyInitData(initData: string, botToken: string): boolean {
  try {
    if (!initData || !botToken) return false;

    const params = new URLSearchParams(initData);
    const gotHash = params.get('hash');
    if (!gotHash) return false;

    const dcs = buildDataCheckString(params);
    const secret = buildSecret(botToken);
    const expected = crypto.createHmac('sha256', secret).update(dcs).digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(gotHash, 'hex'),
    );
  } catch {
    return false;
  }
}

/** Возвращает Telegram ID (или null, без исключений) */
export function getTelegramId(initData: string): string | null {
  try {
    const params = new URLSearchParams(initData);
    const userStr = params.get('user');
    if (!userStr) return null;
    const user = JSON.parse(userStr) as { id?: number | string };
    if (!user || user.id === undefined || user.id === null) return null;
    return String(user.id);
  } catch {
    return null;
  }
}

/** Жёсткая версия — бросает, если ID не найден */
export function getTelegramIdStrict(initData: string): string {
  const id = getTelegramId(initData);
  if (!id) throw new Error('NO_TELEGRAM_ID');
  return id;
}

/**
 * Аккуратно достаём initData из запроса:
 * 1) заголовок x-init-data
 * 2) query ?initData=
 * (body намеренно НЕ читаем)
 */
export function getInitDataFrom(
  req: Request | { headers?: any; url?: string },
): string {
  try {
    const headers: any = (req as any)?.headers;
    // Пытаемся как в Fetch API: headers.get('x-init-data')
    const fromGet =
      typeof headers?.get === 'function' ? headers.get('x-init-data') : null;
    if (typeof fromGet === 'string' && fromGet) return fromGet;

    // Падение обратно на объектный доступ (некоторые рантаймы могут класть plain object)
    const fromObj =
      (typeof headers?.['x-init-data'] === 'string' && headers['x-init-data']) ||
      (typeof headers?.['X-Init-Data'] === 'string' && headers['X-Init-Data']);
    if (fromObj) return fromObj as string;

    const urlStr = (req as any)?.url;
    if (typeof urlStr === 'string' && urlStr) {
      const u = new URL(urlStr);
      const q = u.searchParams.get('initData');
      if (q) return q;
    }
  } catch {
    /* ignore */
  }
  return '';
}

/* -------------------- Алиасы совместимости -------------------- */
/** Старое имя, используем в проекте местами */
export function extractTelegramId(initData: string): string {
  return getTelegramId(initData) ?? '';
}
/** Старое имя для получения initData из запроса */
export const getInitData = getInitDataFrom;
