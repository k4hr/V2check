import { NextResponse, type NextRequest } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';
const DB_URL = process.env.DATABASE_URL || '';
const WH_SECRET = (process.env.TG_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET || '').trim();

function hmacIsValid(initData: string, botToken: string) {
  try {
    if (!initData || !botToken) return { valid: false, reason: 'empty' };
    const url = new URLSearchParams(initData);
    const hash = url.get('hash') || '';
    url.delete('hash');

    const data = [...url.entries()]
      .map(([k, v]) => `${k}=${v}`)
      .sort()
      .join('\n');

    const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const check = crypto.createHmac('sha256', secret).update(data).digest('hex');

    return { valid: check === hash, hash, check };
  } catch (e: any) {
    return { valid: false, reason: e?.message || 'hmac error' };
  }
}

async function tg(method: string, body?: any, timeoutMs = 6000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: ctl.signal
    });
    const j = await res.json().catch(() => null);
    return { ok: res.ok && j?.ok, raw: j };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'fetch error' };
  } finally {
    clearTimeout(t);
  }
}

export async function POST(req: NextRequest) {
  const initData = req.headers.get('x-init-data') || '';
  const hmac = hmacIsValid(initData, BOT_TOKEN);

  let userId: string | null = null;
  try {
    const p = new URLSearchParams(initData);
    const unsafe = JSON.parse(p.get('user') || 'null');
    userId = unsafe?.id ? String(unsafe.id) : null;
  } catch {}

  let dbOk = false;
  let subscription: any = null;
  let dbErr: string | null = null;
  if (DB_URL) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbOk = true;
      if (userId) {
        const u = await prisma.user.findFirst({ where: { telegramId: userId } });
        if (u?.subscriptionUntil) {
          const now = new Date();
          subscription = {
            active: u.subscriptionUntil > now,
            expiresAt: u.subscriptionUntil,
          };
        } else {
          subscription = { active: false, expiresAt: null };
        }
      }
    } catch (e: any) {
      dbErr = e?.message || 'db error';
    }
  }

  const getMe = BOT_TOKEN ? await tg('getMe') : { ok: false, error: 'NO_BOT_TOKEN' };
  const whInfo = BOT_TOKEN ? await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`)
    .then(r => r.json()).catch(() => null) : null;

  const hints: string[] = [];
  if (!BOT_TOKEN) hints.push('BOT_TOKEN пуст');
  if (!WH_SECRET) hints.push('TG_WEBHOOK_SECRET не задан (рекомендуется)');
  if (!whInfo?.result?.url) hints.push('Webhook не установлен через /api/admin/setWebhook');
  if (!hmac.valid) hints.push('initData HMAC невалиден — MiniApp и BOT_TOKEN не совпадают');
  if (!dbOk) hints.push('Проблема с БД или миграциями');
  if (subscription && !subscription.active) hints.push('Подписка не активна — не пришёл successful_payment?');

  return NextResponse.json({
    ok: true,
    env: {
      hasBotToken: !!BOT_TOKEN,
      hasDb: !!DB_URL,
      hasWebhookSecret: !!WH_SECRET
    },
    hmac: {
      valid: hmac.valid,
      ...(hmac.valid ? {} : { reason: hmac.reason })
    },
    user: { id: userId },
    db: { ok: dbOk, error: dbErr },
    subscription,
    telegram: {
      getMe,
      webhook: whInfo?.result || whInfo || null
    },
    hints
  });
}

export const GET = POST;