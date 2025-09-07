// app/api/me/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyInitData } from '@/lib/auth/verifyInitData';

const prisma = new PrismaClient();

// Достаем telegramId из заголовка/куки/initData.
// Без импорта getTelegramIdStrict — чтобы не упереться в экспорт алиаса.
function extractTelegramId(req: NextRequest): string | null {
  // 1) Явная подстановка (удобно для тестов через Proxy / Postman)
  const direct = req.headers.get('x-telegram-id');
  if (direct) return String(direct);

  // 2) Инициализационные данные WebApp
  const initData =
    req.headers.get('x-telegram-init-data') ??
    req.cookies.get('tg_init_data')?.value ??
    req.nextUrl.searchParams.get('initData') ??
    '';

  const BOT_TOKEN = process.env.TG_BOT_TOKEN || process.env.BOT_TOKEN || '';
  if (initData && BOT_TOKEN) {
    const v = verifyInitData(String(initData), String(BOT_TOKEN));
    if (v.ok && v.data.telegramId) return String(v.data.telegramId);
  }

  // 3) Заголовок/кука с сериализованным user
  const hdr = req.headers.get('x-telegram-user');
  if (hdr) {
    try {
      const u = JSON.parse(hdr);
      if (u?.id) return String(u.id);
    } catch {}
  }
  const c = req.cookies.get('tg_user')?.value;
  if (c) {
    try {
      const u = JSON.parse(c);
      if (u?.id) return String(u.id);
    } catch {}
  }

  // 4) На крайний случай — ?tid=...
  const tid = req.nextUrl.searchParams.get('tid');
  if (tid) return String(tid);

  return null;
}

export async function GET(req: NextRequest) {
  try {
    const telegramId = extractTelegramId(req);
    if (!telegramId) {
      return NextResponse.json({ ok: false, error: 'TELEGRAM_ID_NOT_FOUND' }, { status: 401 });
    }

    // Гарантируем, что пользователь есть в БД
    const user = await prisma.user.upsert({
      where: { telegramId },
      update: {},                 // тут ничего не меняем
      create: { telegramId },     // создаем «чистую» запись
      select: {
        id: true,
        telegramId: true,
        subscriptionUntil: true,  // только те поля, что есть в текущей схеме
      },
    });

    return NextResponse.json({ ok: true, user });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message ?? e) },
      { status: 500 },
    );
  }
}
