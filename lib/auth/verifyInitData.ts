// lib/auth/verifyInitData.ts
// Полная проверка initData (HMAC) по спецификации Telegram Mini Apps.
// Экспортирует verifyInitData, getTelegramId, getTelegramIdStrict.
// Используется в API-ручках. Совместим с импортами как '@/lib/auth/verifyInitData'.

import crypto from 'crypto';

export type VerifyOk =
  | { ok: true; data: Record<string, any> }
  | { ok: false; error: string };

function getSecretKey(botToken: string) {
  // secret_key = HMAC_SHA256("WebAppData", bot_token)
  return crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
}

function parseInitData(initData: string): Record<string, any> {
  const url = new URLSearchParams(initData);
  const obj: Record<string, any> = {};
  url.forEach((v, k) => {
    if (k === 'user' || k === 'receiver' || k === 'chat_instance') {
      try {
        obj[k] = JSON.parse(v);
      } catch {
        obj[k] = v;
      }
    } else {
      obj[k] = v;
    }
  });
  return obj;
}

function buildCheckString(data: Record<string, any>) {
  const entries = Object.entries(data)
    .filter(([k]) => k !== 'hash')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`);
  return entries.join('\n');
}

/**
 * verifyInitData(initData, botToken, maxAgeSeconds?)
 * Возвращает { ok: true, data } при успехе, иначе { ok: false, error }.
 */
export function verifyInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds = 600
): VerifyOk {
  try {
    if (!initData) return { ok: false, error: 'NO_INIT_DATA' };
    if (!botToken) return { ok: false, error: 'NO_BOT_TOKEN' };
    const data = parseInitData(initData);
    const checkString = buildCheckString(data);
    const secret = getSecretKey(botToken);
    const hmac = crypto.createHmac('sha256', secret).update(checkString).digest('hex');
    if (hmac !== data.hash) return { ok: false, error: 'BAD_HASH' };

    const now = Math.floor(Date.now() / 1000);
    const authDate = Number(data.auth_date || 0);
    if (!authDate || now - authDate > maxAgeSeconds) {
      return { ok: false, error: 'EXPIRED' };
    }
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'VERIFY_ERROR' };
  }
}

/**
 * Вспомогалки для API-ручек
 * Ищем initData в заголовках x-telegram-init-data / x-init-data, либо в теле { initData }.
 */
async function extractInitDataFromRequest(req: Request): Promise<string> {
  const h1 = req.headers.get('x-telegram-init-data');
  const h2 = req.headers.get('x-init-data');
  if (h1) return h1;
  if (h2) return h2;
  try {
    const j = await req.clone().json().catch(() => ({}));
    if (j?.initData) return String(j.initData);
  } catch {}
  return '';
}

export async function getTelegramId(req: Request, botToken?: string) {
  const init = await extractInitDataFromRequest(req);
  const token = botToken || process.env.TG_BOT_TOKEN || process.env.BOT_TOKEN || '';
  const v = verifyInitData(init, token);
  if (!v.ok) return null;
  const u = v.data?.user || {};
  return u?.id ? String(u.id) : null;
}

export async function getTelegramIdStrict(req: Request, botToken?: string) {
  const tid = await getTelegramId(req, botToken);
  if (!tid) throw new Error('UNAUTHORIZED');
  return tid;
}
