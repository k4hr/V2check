// app/api/favorites/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyInitData, getTelegramIdStrict } from '@/lib/auth/verifyInitData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';

function extractInitData(req: NextRequest): string {
  // 1) body
  // 2) x-init-data
  // 3) ?initData=
  let from = '';
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const url = new URL(req.url);
  const hdr = req.headers.get('x-init-data');

  // Внимание: читать тело можно один раз; в Next API это ок
  // если фронт шлёт JSON { initData: "..." } — получим здесь
  // если нет — упадём в catch и возьмём из заголовка/квери
  // Возвращаем ПУСТУЮ строку если ничего не нашли
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const body = (req as any)._bodyUsed ? null : undefined;
    // Если _bodyUsed неизвестен — всё равно пробуем .json()
    // В случае ошибки ловим и идём дальше
  } catch {}
  return (async () => {
    try {
      const b: any = await req.json().catch(() => null);
      if (b && typeof b.initData === 'string') return b.initData;
    } catch {}
    if (hdr) return hdr;
    const q = url.searchParams.get('initData');
    return q || '';
  })() as unknown as string; // см. ниже: мы всё равно ждём в хендлерах через await
}

async function requireUser(req: NextRequest) {
  if (!BOT_TOKEN) {
    return { err: NextResponse.json({ ok: false, error: 'BOT_TOKEN_MISSING' }, { status: 500 }) };
  }
  const initData = await (extractInitData(req) as unknown as Promise<string>);
  if (!initData) {
    return { err: NextResponse.json({ ok: false, error: 'INIT_DATA_REQUIRED' }, { status: 400 }) };
  }
  const ok = verifyInitData(initData, BOT_TOKEN);
  if (!ok) {
    return { err: NextResponse.json({ ok: false, error: 'INVALID_INIT_DATA' }, { status: 401 }) };
  }
  let telegramId = '';
  try {
    telegramId = getTelegramIdStrict(initData);
  } catch {
    return { err: NextResponse.json({ ok: false, error: 'NO_TELEGRAM_ID' }, { status: 400 }) };
  }
  const user = await prisma.user.upsert({
    where: { telegramId },
    update: { updatedAt: new Date() },
    create: { telegramId },
  });
  return { user };
}

export async function GET(req: NextRequest) {
  try {
    const { user, err } = await requireUser(req);
    if (err) return err;

    const items = await prisma.favorite.findMany({
      where: { userId: user!.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, url: true, note: true, createdAt: true },
    });

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, err } = await requireUser(req);
    if (err) return err;

    const body = await req.json().catch(() => ({}));
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    const url = typeof body?.url === 'string' ? body.url.trim() : null;
    const note = typeof body?.note === 'string' ? body.note.trim() : null;

    if (!title) {
      return NextResponse.json({ ok: false, error: 'TITLE_REQUIRED' }, { status: 400 });
    }

    const created = await prisma.favorite.create({
      data: {
        userId: user!.id,
        title,
        url,
        note,
      },
      select: { id: true, title: true, url: true, note: true, createdAt: true },
    });

    return NextResponse.json({ ok: true, item: created });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user, err } = await requireUser(req);
    if (err) return err;

    const url = new URL(req.url);
    const id = url.searchParams.get('id') || '';

    if (!id) {
      return NextResponse.json({ ok: false, error: 'ID_REQUIRED' }, { status: 400 });
    }

    // Безопасно: удаляем только у этого пользователя
    await prisma.favorite.deleteMany({ where: { id, userId: user!.id } });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
