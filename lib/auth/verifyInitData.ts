// lib/auth/verifyInitData.ts
import crypto from 'crypto';

function getSecret(botToken: string) {
  // TG TMA secret = HMAC_SHA256("WebAppData", BOT_TOKEN)
  return crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
}

/** Возвращает true/false — корректен ли initData для данного бота */
export function verifyInitData(initData: string, botToken: string): boolean {
  if (!initData || !botToken) return false;

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return false;

  // canonical data
  const dataCheckString = Array.from(params.entries())
    .filter(([k]) => k !== 'hash')
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n');

  const hmac = crypto.createHmac('sha256', getSecret(botToken)).update(dataCheckString).digest('hex');
  return hmac === hash;
}

/** Достаёт telegramId из initData (если он там есть), иначе null */
export function extractTelegramId(initData: string): string | null {
  if (!initData) return null;
  const params = new URLSearchParams(initData);
  const userRaw = params.get('user');
  if (!userRaw) return null;
  try {
    const user = JSON.parse(userRaw) as { id?: number | string };
    if (user && user.id != null) return String(user.id);
  } catch {}
  return null;
}

/** Универсальный геттер initData из Next Request или строки */
export async function getInitDataFrom(reqOrStr: Request | string): Promise<string> {
  if (typeof reqOrStr === 'string') return reqOrStr;
  // при вызове из TMA кладём initData в заголовок x-init-data
  const fromHeader = reqOrStr.headers.get('x-init-data');
  if (fromHeader) return fromHeader;

  // запасной путь: из query ?initData=...
  try {
    const url = new URL(reqOrStr.url);
    const q = url.searchParams.get('initData') || url.searchParams.get('initdata');
    if (q) return q;
  } catch {}
  return '';
}
