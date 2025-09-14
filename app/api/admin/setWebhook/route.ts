// app/api/admin/setWebhook/route.ts
import { NextResponse, type NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';
const ADMIN_KEY = process.env.ADMIN_KEY || '';

function getAdminKey(req: NextRequest) {
  // 1) из заголовка x-admin-key
  const fromHeader = req.headers.get('x-admin-key');
  if (fromHeader) return fromHeader;
  // 2) из query ?key=...
  const url = new URL(req.url);
  const fromQuery = url.searchParams.get('key');
  return fromQuery || '';
}

function getOrigin(req: NextRequest) {
  // Пытаемся угадать origin сервиса
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
  const proto = (req.headers.get('x-forwarded-proto') || 'https').split(',')[0].trim();
  if (host) return `${proto}://${host}`;
  // Фоллбек: можно передать ?origin=https://example.com
  const url = new URL(req.url);
  return url.searchParams.get('origin') || '';
}

export async function POST(req: NextRequest) {
  try {
    if (!ADMIN_KEY) {
      return NextResponse.json({ ok: false, error: 'ADMIN_KEY_MISSING' }, { status: 500 });
    }
    if (!BOT_TOKEN) {
      return NextResponse.json({ ok: false, error: 'BOT_TOKEN_MISSING' }, { status: 500 });
    }

    const provided = getAdminKey(req);
    if (provided !== ADMIN_KEY) {
      return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });
    }

    const origin = getOrigin(req);
    if (!origin) {
      return NextResponse.json({ ok: false, error: 'ORIGIN_UNKNOWN' }, { status: 400 });
    }

    const webhookUrl = `${origin}/api/botWebhook`;

    const tgResp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        // можно добавить секрет, если используешь его в /api/botWebhook:
        // secret_token: process.env.TG_PROVIDER_TOKEN || undefined,
        allowed_updates: ['message', 'pre_checkout_query', 'successful_payment'],
        drop_pending_updates: true,
      }),
    });

    const data = await tgResp.json().catch(() => null);

    return NextResponse.json({
      ok: tgResp.ok && data?.ok === true,
      used: { webhookUrl },
      tg: data,
    }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}

// Для удобства теста из браузера:
export const GET = POST;
