import { NextResponse, type NextRequest } from 'next/server';
import { verifyInitData, getTelegramId, getInitDataFrom } from '@/lib/auth/verifyInitData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';
const ADMIN_TG_IDS = String(process.env.ADMIN_TG_IDS || '')
  .split(/[,\s]+/)
  .map(s => s.trim())
  .filter(Boolean);
const ALLOW_BROWSER_DEBUG = (process.env.ALLOW_BROWSER_DEBUG || '').trim() === '1';

function getCookieFromHeader(headers: Headers, name: string): string {
  try {
    const raw = headers.get('cookie') || '';
    const parts = raw.split(/;\s*/);
    for (const p of parts) {
      const [k, ...v] = p.split('=');
      if (decodeURIComponent(k) === name) {
        return decodeURIComponent(v.join('='));
      }
    }
  } catch {}
  return '';
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    // 1) initData: заголовок -> cookie -> ?initData
    let initData = getInitDataFrom(req as any) || '';
    if (!initData) initData = getCookieFromHeader(req.headers, 'tg_init_data') || '';
    if (!initData) initData = url.searchParams.get('initData') || '';

    let via: 'initData' | 'cookie' | 'query' | 'debugId' | 'none' = 'none';
    if (initData) {
      const ok = verifyInitData(initData, BOT_TOKEN);
      if (ok) {
        const id = getTelegramId(initData);
        if (id && ADMIN_TG_IDS.includes(String(id))) {
          return NextResponse.json({ ok: true, admin: true, id: String(id), via: 'initData' });
        }
        return NextResponse.json({ ok: true, admin: false, id: id || null, via: 'initData' });
      }
      via = 'initData';
      // если initData есть, но невалиден — продолжаем к debug (ниже), но помечаем причину
    }

    // 2) Debug режим (только если разрешён)
    if (ALLOW_BROWSER_DEBUG) {
      const debugId = url.searchParams.get('id');
      if (debugId && /^\d{3,15}$/.test(debugId)) {
        return NextResponse.json({
          ok: true,
          admin: ADMIN_TG_IDS.includes(String(debugId)),
          id: String(debugId),
          via: 'debugId',
        });
      }
    }

    return NextResponse.json({ ok: true, admin: false, id: null, via });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}

// совместимость
export const POST = GET;
