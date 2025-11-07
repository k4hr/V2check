import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';
const ADMIN_TOKEN = (process.env.ADMIN_TOKEN || '').trim();

function isAdmin(req: Request) {
  const t = (req.headers.get('x-admin-token') || '').trim();
  const init = (req.headers.get('x-init-data') || req.headers.get('x-init-data-raw') || '').trim();
  return (ADMIN_TOKEN && t && t === ADMIN_TOKEN) || !!init;
}

export async function GET(req: Request) {
  try {
    if (!isAdmin(req)) return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });
    if (!BOT_TOKEN) return NextResponse.json({ ok: false, error: 'BOT_TOKEN_MISSING' }, { status: 500 });

    const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getAvailableGifts`, { cache: 'no-store' });
    const j = await r.json();

    if (!r.ok || !j?.ok) {
      return NextResponse.json({ ok: false, error: j?.description || 'TG_ERROR' }, { status: 400 });
    }

    const gifts = (j.result?.gifts || []).map((g: any) => ({
      id: String(g.id),
      title: g.title || '',
      star_count: Number(g.star_count || 0),
    }));

    return NextResponse.json({ ok: true, gifts });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
