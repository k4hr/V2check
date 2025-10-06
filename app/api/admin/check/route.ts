import { NextResponse, type NextRequest } from 'next/server';
import {
  verifyInitData,
  getInitDataFrom,
  getTelegramId,
} from '@/lib/auth/verifyInitData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ADMIN_TG_IDS = String(process.env.ADMIN_TG_IDS || '')
  .split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';
const ALLOW_BROWSER_DEBUG = (process.env.ALLOW_BROWSER_DEBUG || '').trim() === '1';

export async function GET(req: NextRequest) {
  try {
    const initData = getInitDataFrom(req);
    let id = '';
    if (initData) {
      if (!BOT_TOKEN || !verifyInitData(initData, BOT_TOKEN)) {
        return NextResponse.json({ ok:false, error:'BAD_INITDATA' }, { status:401 });
      }
      id = getTelegramId(initData) || '';
    }
    if (!id && ALLOW_BROWSER_DEBUG) {
      const u = new URL(req.url);
      const qid = u.searchParams.get('id') || '';
      if (/^\d{3,15}$/.test(qid)) id = qid;
    }
    const admin = !!id && ADMIN_TG_IDS.includes(id);
    return NextResponse.json({ ok: true, admin, id });
  } catch (e: any) {
    return NextResponse.json({ ok:false, error: e?.message || 'SERVER_ERROR' }, { status:500 });
  }
}
