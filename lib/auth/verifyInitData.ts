// lib/auth/verifyInitData.ts
import crypto from 'crypto';

function getSecret(token: string) {
  return crypto.createHmac('sha256', 'WebAppData').update(token).digest();
}

export function verifyInitData(initData: string, botToken: string): boolean {
  if (!initData || !botToken) return false;
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash') || '';
  urlParams.delete('hash');

  const data = Array.from(urlParams.entries())
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('
');

  const hmac = crypto.createHmac('sha256', getSecret(botToken))
    .update(data)
    .digest('hex');

  return hmac === hash;
}

export function getTelegramIdStrict(initData: string): string {
  // Parses initData `user` field and returns Telegram user id as string
  const params = new URLSearchParams(initData);
  const raw = params.get('user');
  if (!raw) throw new Error('NO_USER');
  const user = JSON.parse(raw);
  const id = String(user.id || '');
  if (!id) throw new Error('NO_USER_ID');
  return id;
}
