import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';
const ALLOW_BROWSER_DEBUG = (process.env.ALLOW_BROWSER_DEBUG || '').trim() === '1';

function hmacIsValid(initData: string, botToken: string) {
  if (!initData || !botToken) return false;
  const url = new URLSearchParams(initData);
  const hash = url.get('hash') || '';
  url.delete('hash');
  const data = [...url.entries()].map(([k, v]) => `${k}=${v}`).sort().join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const check  = crypto.createHmac('sha256', secret).update(data).digest('hex');
  return check === hash;
}

function extractUserIdFromInitData(initData: string): string | null {
  try {
    const p = new URLSearchParams(initData);
    const unsafe = JSON.parse(p.get('user') || 'null');
    const id = unsafe?.id ? String(unsafe.id) : null;
    return id;
  } catch { return null; }
}

export async function getUserFromRequest(req: NextRequest) {
  const url = new URL(req.url);
  const initData = req.headers.get('x-init-data') || '';

  let telegramId: string | null = null;

  if (initData) {
    if (!hmacIsValid(initData, BOT_TOKEN)) {
      throw new Error('BAD_INITDATA');
    }
    telegramId = extractUserIdFromInitData(initData);
  }

  if (!telegramId && ALLOW_BROWSER_DEBUG) {
    const debugId = url.searchParams.get('id');
    if (debugId && /^\d{3,15}$/.test(debugId)) telegramId = debugId;
  }

  if (!telegramId) throw new Error('AUTH_REQUIRED');

  const user = await prisma.user.findFirst({ where: { telegramId: String(telegramId) } });
  if (!user) throw new Error('USER_NOT_FOUND');

  return user;
}
