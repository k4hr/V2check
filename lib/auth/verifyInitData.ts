// verifyInitData.ts — валидация Telegram initData по официальной схеме
// Secret = HMAC_SHA256("WebAppData", BOT_TOKEN)
import crypto from 'crypto';

export type VerifyResult =
  | { ok: true; payload: { user?: any; auth_date?: number } }
  | { ok: false; reason: 'missing' | 'nohash' | 'bad-sign' };

export function verifyInitData(initData: string, botToken: string): VerifyResult {
  if (!initData || !botToken) return { ok: false, reason: 'missing' };

  const params = new URLSearchParams(initData);
  const hash = params.get('hash') || '';
  if (!hash) return { ok: false, reason: 'nohash' };

  // Собираем data-check-string из пар "key=value", исключая hash, сортируем по ключу
  const pairs: string[] = [];
  params.forEach((v, k) => { if (k !== 'hash') pairs.push(`${k}=${v}`); });
  pairs.sort();
  const dataCheckString = pairs.join('\n');

  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calc = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');

  if (calc !== hash) return { ok: false, reason: 'bad-sign' };

  const payload: any = {};
  params.forEach((v, k) => {
    if (k === 'user') {
      try { payload.user = JSON.parse(v); } catch {}
    } else if (k === 'auth_date') {
      const n = Number(v); if (!Number.isNaN(n)) payload.auth_date = n;
    }
  });

  return { ok: true, payload };
}
