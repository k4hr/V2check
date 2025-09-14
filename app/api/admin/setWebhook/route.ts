// app/api/admin/setWebhook/route.ts
// Назначает/проверяет webhook для Telegram-бота и помогает диагностировать,
// почему статусы подписки не обновляются (обычно потому, что вебхук не установлен).
import { NextResponse, type NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';
// Простой гард, чтобы не открыть ручку всем. Установи ADMIN_KEY в переменных окружения.
const ADMIN_KEY = process.env.ADMIN_KEY || '';

function getBaseUrl(req: NextRequest) {
  // Railway/ВПН/прокси — читаем из заголовков
  // @ts-ignore — у NextRequest есть .headers и .url
  const proto = (req.headers.get('x-forwarded-proto') || 'https').split(',')[0].trim() || 'https';
  // @ts-ignore
  const host  = (req.headers.get('x-forwarded-host')  || req.headers.get('host') || '').split(',')[0].trim();
  if (!host) return null;
  return `${proto}://${host}`;
}

async function tg<T>(method: string, body?: any): Promise<T> {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    // на всякий случай
    cache: 'no-store',
    // @ts-ignore
    next: { revalidate: 0 },
  });
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return data;
}

export async function GET(req: NextRequest) {
  if (!BOT_TOKEN) {
    return NextResponse.json({ ok: false, error: 'BOT_TOKEN_MISSING' }, { status: 500 });
  }
  if (!ADMIN_KEY) {
    return NextResponse.json({ ok: false, error: 'ADMIN_KEY_MISSING' }, { status: 500 });
  }
  if ((req.headers.get('x-admin-key') || '') !== ADMIN_KEY) {
    return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get('action') || 'status'; // status | set | delete

  try {
    if (action === 'delete') {
      const delRes = await tg<any>('deleteWebhook', { drop_pending_updates: false });
      const info = await tg<any>('getWebhookInfo');
      return NextResponse.json({ ok: true, deleted: delRes, info });
    }

    if (action === 'set') {
      const base = getBaseUrl(req);
      if (!base) {
        return NextResponse.json({ ok: false, error: 'CANT_DETERMINE_BASE_URL' }, { status: 400 });
      }
      const hookUrl = `${base}/api/botWebhook`;
      const setRes = await tg<any>('setWebhook', {
        url: hookUrl,
        allowed_updates: ['message', 'pre_checkout_query'],
        drop_pending_updates: false,
      });
      const info = await tg<any>('getWebhookInfo');
      return NextResponse.json({ ok: true, url: hookUrl, set: setRes, info });
    }

    // default: status
    const info = await tg<any>('getWebhookInfo');
    return NextResponse.json({ ok: true, info });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
