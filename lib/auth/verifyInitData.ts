import type { NextRequest } from 'next/server';
import crypto from 'crypto';

const BOT_TOKEN = process.env.TG_BOT_TOKEN || process.env.BOT_TOKEN;

function parseInitData(data: string): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(data));
}

function checkSignature(data: string) {
  if (!BOT_TOKEN) throw new Error('TG_BOT_TOKEN is not set');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const url = new URLSearchParams(data);
  const hash = url.get('hash') || '';
  url.delete('hash');
  const pairs = Array.from(url.entries()).map(([k, v]) => `${k}=${v}`).sort();
  const str = pairs.join('\n');
  const signature = crypto.createHmac('sha256', secret).update(str).digest('hex');
  return signature === hash;
}

export async function getTelegramId(req: NextRequest): Promise<string> {
  const testHeader = req.headers.get('x-telegram-id');
  if (testHeader) return String(testHeader);

  const initData =
    req.headers.get('x-telegram-init-data') ??
    req.nextUrl.searchParams.get('initData') ??
    req.cookies.get('tg_init_data')?.value ??
    '';

  if (!initData) throw new Error('No initData');
  if (!checkSignature(initData)) throw new Error('Bad signature');

  const parsed = parseInitData(initData);
  const userJson = parsed['user'];
  if (!userJson) throw new Error('No user in initData');

  const user = JSON.parse(userJson);
  return String(user.id);
}
