import crypto from 'crypto';

export type TgInitData = {
  query: string;
  data: Record<string, any>;
  user?: {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    photo_url?: string;
    allows_write_to_pm?: boolean;
  };
  auth_date?: number;
  hash?: string;
};

export function parseInitData(initData: string): TgInitData {
  const params = new URLSearchParams(initData);
  const data: Record<string, any> = {};
  let user: any = undefined;
  let auth_date: number | undefined;
  let hash: string | undefined;

  params.forEach((value, key) => {
    if (key === 'user') {
      try { user = JSON.parse(value); } catch { user = undefined; }
    } else if (key === 'auth_date') {
      auth_date = Number(value);
    } else if (key === 'hash') {
      hash = value;
    } else {
      data[key] = value;
    }
  });
  return { query: initData, data, user, auth_date, hash };
}

function buildDataCheckString(obj: Record<string, any>, user?: any, auth_date?: number) {
  const kv: string[] = [];
  if (user) kv.push(`user=${JSON.stringify(user)}`);
  if (auth_date) kv.push(`auth_date=${auth_date}`);
  Object.keys(obj).sort().forEach(k => {
    kv.push(`${k}=${obj[k]}`);
  });
  return kv.sort().join('\n');
}

export function verifyInitData(initData: string, botToken: string): { ok: boolean; reason?: string; payload?: TgInitData } {
  if (!initData) return { ok: false, reason: 'Missing initData' };
  if (!botToken) return { ok: false, reason: 'Missing BOT_TOKEN' };

  const parsed = parseInitData(initData);
  const { user, auth_date, hash } = parsed;
  if (!hash) return { ok: false, reason: 'Missing hash' };

  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const dataCheck = buildDataCheckString(parsed.data, user, auth_date);
  const h = crypto.createHmac('sha256', secret).update(dataCheck).digest('hex');

  if (h !== hash) return { ok: false, reason: 'Bad signature' };

  if (auth_date && Date.now()/1000 - auth_date > 60*60*24) {
    return { ok: false, reason: 'Auth data expired' };
  }
  return { ok: true, payload: parsed };
}
