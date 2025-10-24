/* path: lib/auth/verifyInitData.ts */
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
 * Аккуратно достаём initData из запроса. Поддерживаем все «живые» варианты:
 *  Заголовки (любые регистры):
 *    - x-telegram-init-data
 *    - x-tg-init-data
 *    - x-init-data            (исторический)
 *  Query:
 *    - ?initData=
 *    - ?tgInitData=
 *  Cookie:
 *    - tg_init_data
 */
export function getInitDataFrom(
  req: Request | { headers?: any; url?: string },
): string {
  try {
    const headersAny: any = (req as any)?.headers;

    // Универсальный геттер (поддержка Fetch Headers и «обычного» объекта)
    const getHeader = (name: string) => {
      if (!headersAny) return '';
      if (typeof headersAny.get === 'function') {
        const v = headersAny.get(name);
        if (typeof v === 'string' && v) return v;
        // пробуем в нижнем регистре (на случай кастомных реализаций)
        const lower = headersAny.get(name.toLowerCase());
        if (typeof lower === 'string' && lower) return lower;
      } else {
        // объект без прототипа/кейсы регистров
        const keys = Object.keys(headersAny);
        const found = keys.find(k => k.toLowerCase() === name.toLowerCase());
        if (found) {
          const v = headersAny[found];
          if (typeof v === 'string' && v) return v;
        }
      }
      return '';
    };

    // 1) Заголовки — список приоритетов
    const headerCandidates = [
      'x-telegram-init-data',
      'x-tg-init-data',
      'x-init-data',
      'X-Telegram-Init-Data',
      'X-Tg-Init-Data',
      'X-Init-Data',
    ];
    for (const h of headerCandidates) {
      const v = getHeader(h);
      if (v) return v;
    }

    // 2) Query string
    const urlStr = (req as any)?.url;
    if (typeof urlStr === 'string' && urlStr) {
      const u = new URL(urlStr);
      const q1 = u.searchParams.get('initData');
      if (q1) return q1;
      const q2 = u.searchParams.get('tgInitData');
      if (q2) return q2;
    }

    // 3) Cookie (как крайний фолбэк)
    try {
      // грубый парсер cookies, т.к. тип Request может быть разным
      const cookieHeader = getHeader('cookie');
      if (cookieHeader) {
        const m = cookieHeader.match(/(?:^|;\s*)tg_init_data=([^;]+)/i);
        if (m?.[1]) return decodeURIComponent(m[1]);
      }
    } catch {
      /* ignore */
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
