import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';
const ADMIN_TOKEN = (process.env.ADMIN_TOKEN || '').trim();

function isAdmin(req: Request) {
  const t = (req.headers.get('x-admin-token') || '').trim();
  const init = (req.headers.get('x-init-data') || req.headers.get('x-init-data-raw') || '').trim();
  return (ADMIN_TOKEN && t && t === ADMIN_TOKEN) || !!init;
}

async function tg(method: string, payload: any) {
  const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const j = await r.json().catch(() => ({}));
  return { status: r.status, body: j };
}

export async function POST(req: Request) {
  try {
    if (!isAdmin(req)) return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });
    if (!BOT_TOKEN) return NextResponse.json({ ok: false, error: 'BOT_TOKEN_MISSING' }, { status: 500 });

    const body = await req.json().catch(() => ({}));
    const gift_id = String(body?.gift_id || '').trim();
    const channels = Array.isArray(body?.channels) ? body.channels : [];
    const text = typeof body?.text === 'string' ? body.text : '';

    if (!gift_id || !channels.length) {
      return NextResponse.json({ ok: false, error: 'BAD_INPUT' }, { status: 400 });
    }

    const results: any[] = [];
    for (const raw of channels) {
      const chat_id = (typeof raw === 'string' ? raw.trim() : raw) as string;
      if (!chat_id) continue;

      try {
        const { status, body: j } = await tg('sendGift', { chat_id, gift_id, text });
        if (status === 200 && j?.ok) {
          results.push({ chat_id, ok: true, message_id: j?.result?.message_id ?? null });
        } else {
          results.push({ chat_id, ok: false, error: j?.description || `TG_${status}` });
        }
        await new Promise(r => setTimeout(r, 1000)); // троттлинг
      } catch (e: any) {
        results.push({ chat_id, ok: false, error: String(e?.message || e) });
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
