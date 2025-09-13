// app/api/me/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyInitData, getTelegramIdStrict } from '@/lib/auth/verifyInitData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';

async function extractInitData(req: NextRequest): Promise<string> {
  // 1) body { initData }, 2) header x-init-data, 3) ?initData=
  try {
    const body: any = await req.json().catch(() => null);
    if (body && typeof body.initData === 'string') return body.initData;
  } catch {}
  const hdr = req.headers.get('x-init-data');
  if (hdr) return hdr;
  const url = new URL(req.url);
  return url.searchParams.get('initData') || '';
}

export async function GET(req: NextRequest) {
  try {
    if (!BOT_TOKEN) {
      return NextResponse.json({ ok: false, error: 'BOT_TOKEN_MISSING' }, { status: 500 });
    }

    const initData = await extractInitData(req);
    if (!initData) {
      return NextResponse.json({ ok: false, error: 'INIT_DATA_REQUIRED' }, { status: 400 });
    }

    // verifyInitData теперь boolean
    const verified = verifyInitData(initData, BOT_TOKEN);
    if (!verified) {
      return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }

    // Достаём telegramId из проверенного initData
    const telegramId = getTelegramIdStrict(initData);

    // Апсертим пользователя (по схеме: id:string, telegramId:string unique, ... )
    const user = await prisma.user.upsert({
      where: { telegramId },
      update: { updatedAt: new Date() },
      create: { telegramId },
      select: {
        id: true,
        telegramId: true,
        username: true,
        firstName: true,
        lastName: true,
        photoUrl: true,
        subscriptionUntil: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Признак активной подписки
    const now = new Date();
    const isPro = !!(user.subscriptionUntil && new Date(user.subscriptionUntil) > now);

    return NextResponse.json({
      ok: true,
      user,
      pro: isPro,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
