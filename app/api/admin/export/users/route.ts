import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'node:crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN = (process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '').trim();
const ADMIN_TG_IDS = (process.env.ADMIN_TG_IDS || '').split(/[,\s]+/).filter(Boolean);

function verifyInitData(initData: string): { ok: boolean; userId?: string } {
  try {
    if (!initData || !BOT_TOKEN) return { ok: false };
    const sp = new URLSearchParams(initData);
    const hash = sp.get('hash') || '';
    sp.delete('hash');
    const pairs: string[] = [];
    Array.from(sp.keys()).sort().forEach(k => { pairs.push(`${k}=${sp.get(k)}`); });
    const dataCheckString = pairs.join('\n');

    const secretKey = crypto.createHash('sha256').update('WebAppData' + BOT_TOKEN).digest();
    const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    if (hmac !== hash) return { ok: false };

    const userRaw = sp.get('user');
    if (!userRaw) return { ok: true };
    const user = JSON.parse(userRaw);
    return { ok: true, userId: String(user?.id ?? '') };
  } catch { return { ok: false }; }
}

export async function GET(req: NextRequest) {
  try {
    // initData берём из заголовка или из query (?init=)
    const initHeader = req.headers.get('x-init-data') || req.headers.get('x-telegram-init-data') || '';
    const initQuery = new URL(req.url).searchParams.get('init') || '';
    const init = (initHeader || initQuery).trim();

    const ver = verifyInitData(init);
    if (!ver.ok) return NextResponse.json({ ok: false, error: 'INIT_DATA_BAD' }, { status: 401 });
    if (ADMIN_TG_IDS.length && (!ver.userId || !ADMIN_TG_IDS.includes(String(ver.userId)))) {
      return NextResponse.json({ ok: false, error: 'NOT_ADMIN' }, { status: 403 });
    }

    const url = new URL(req.url);
    const format = (url.searchParams.get('format') || 'txt').toLowerCase(); // txt|csv
    const fromStr = url.searchParams.get('from') || ''; // YYYY-MM-DD
    const toStr = url.searchParams.get('to') || '';

    // Диапазон дат по createdAt (если поле есть в модели)
    const where: any = { telegramId: { not: null } };
    if (fromStr || toStr) {
      where.createdAt = {};
      if (fromStr) where.createdAt.gte = new Date(fromStr + 'T00:00:00Z');
      if (toStr)   where.createdAt.lt  = new Date(toStr + 'T23:59:59.999Z');
    }

    const rows = await prisma.user.findMany({
      where,
      select: { telegramId: true /*, createdAt: true*/ },
      orderBy: { /*createdAt: 'asc'*/ telegramId: 'asc' },
      take: 500_000,
    });

    // Только «цифровые» (реальные tg user id), без vk:...
    const ids = rows.map(r => r.telegramId).filter((x): x is string => !!x && /^\d+$/.test(x));

    if ((url.searchParams.get('mode') || '').toLowerCase() === 'count') {
      return NextResponse.json({ ok: true, count: ids.length });
    }

    const payload =
      format === 'csv'
        ? 'telegram_id\n' + ids.map(id => `${id}`).join('\n')
        : ids.join('\n');

    const fn = `users_${new Date().toISOString().slice(0,10)}.${format}`;
    return new NextResponse(payload, {
      status: 200,
      headers: {
        'Content-Type': format === 'csv' ? 'text/csv; charset=utf-8' : 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fn}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
