import { NextResponse, type NextRequest } from 'next/server';
import { verifyInitData, getTelegramId } from '@/lib/auth/verifyInitData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';

// список админов через ENV: ADMIN_TG_IDS="123, 456 789"
const ADMIN_TG_IDS = String(process.env.ADMIN_TG_IDS || '')
  .split(/[,\s]+/)
  .map(s => s.trim())
  .filter(Boolean);

// разрешить браузерный debug (без initData)
const ALLOW_BROWSER_DEBUG =
  (process.env.ALLOW_BROWSER_DEBUG || '').trim() === '1' ||
  (process.env.NEXT_PUBLIC_ALLOW_BROWSER_DEBUG || '').trim() === '1';

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

function pickInitDataFromHeaders(h: Headers): string {
  // поддерживаем все часто используемые варианты заголовка
  return (
    h.get('x-init-data') ||
    h.get('X-Init-Data') ||
    h.get('x-tg-init-data') ||
    h.get('X-Tg-Init-Data') ||
    ''
  );
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    // 1) initData: заголовок -> cookie -> ?initData
    let initData =
      pickInitDataFromHeaders(req.headers) ||
      getCookieFromHeader(req.headers, 'tg_init_data') ||
      url.searchParams.get('initData') ||
      '';

    let via: 'initData' | 'cookie' | 'query' | 'debugId' | 'none' = 'none';

    if (initData) {
      via = 'initData';
      const ok = verifyInitData(initData, BOT_TOKEN);
      if (ok) {
        const id = getTelegramId(initData);
        if (id && ADMIN_TG_IDS.includes(String(id))) {
          return NextResponse.json({ ok: true, admin: true, id: String(id), via: 'initData' });
        }
        return NextResponse.json({ ok: true, admin: false, id: id || null, via: 'initData' });
      }
      // если initData есть, но невалиден — продолжим к debug режиму ниже
    }

    // 2) Debug режим (только если явно разрешён)
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

    // 3) по умолчанию — не админ
    return NextResponse.json({ ok: true, admin: false, id: null, via });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}

// совместимость
export const POST = GET;
