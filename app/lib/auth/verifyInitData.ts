// verifyInitData.ts — Telegram WebApp initData validation
// Spec: https://core.telegram.org/bots/webapps#validating-data-received-via-the-web-app
import crypto from 'crypto';

export type TgInitUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  allows_write_to_pm?: boolean;
};

export type VerifyResult =
  | { ok: true; payload: { user?: TgInitUser; auth_date?: number } }
  | { ok: false; reason: 'missing' | 'nohash' | 'bad-sign' | 'expired' };

export function verifyInitData(initData: string, botToken: string): VerifyResult {
  if (!initData || !botToken) return { ok: false, reason: 'missing' };

  const params = new URLSearchParams(initData);

  let user: TgInitUser | undefined;
  let auth_date: number | undefined;
  let hash: string | undefined;
  const other: Record<string, string> = {};

  for (const [key, value] of params.entries()) {
    if (key === 'user') {
      try { user = JSON.parse(value) as TgInitUser; } catch {}
    } else if (key === 'auth_date') {
      const n = Number(value);
      if (!Number.isNaN(n)) auth_date = n;
    } else if (key === 'hash') {
      hash = value;
    } else {
      other[key] = value;
    }
  }

  if (!hash) return { ok: false, reason: 'nohash' };

  // Secret key = HMAC_SHA256("WebAppData", bot_token)
  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();

  // Build data-check-string: sorted "key=value" lines
  const lines: string[] = [];
  if (typeof user !== 'undefined') lines.push(`user=${JSON.stringify(user)}`);
  if (typeof auth_date !== 'undefined') lines.push(`auth_date=${auth_date}`);
  Object.keys(other).sort().forEach(k => lines.push(`${k}=${other[k]}`));
  const dataCheckString = lines.sort().join('\n');

  const h = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');
  if (h !== hash) return { ok: false, reason: 'bad-sign' };
  if (auth_date && (Date.now()/1000 - auth_date) > 24*60*60) return { ok: false, reason: 'expired' };

  return { ok: true, payload: { user, auth_date } };
}
