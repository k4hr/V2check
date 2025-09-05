import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTelegramId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const telegramId = await getTelegramId(req);
    if (!telegramId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // создаём пользователя при первом заходе и читаем только существующие поля
    const user = await prisma.user.upsert({
      where: { telegramId },
      update: {},
      create: { telegramId },
      select: {
        telegramId: true,
        subscriptionUntil: true,
      },
    });

    const now = new Date();
    const active = !!(user.subscriptionUntil && user.subscriptionUntil > now);

    return NextResponse.json({
      ok: true,
      user,
      subscriptionActive: active,
      subscriptionUntil: user.subscriptionUntil,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}
