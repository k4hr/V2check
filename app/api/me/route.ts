import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getTelegramId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const telegramId = await getTelegramId(req);
    if (!telegramId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: {
        telegramId: true,
        firstName: true,
        lastName: true,
        username: true,
        photoUrl: true,
        subscriptionUntil: true,
      },
    });

    if (!user) {
      return NextResponse.json({ ok: true, user: null, subscriptionActive: false });
    }

    const now = new Date();
    const active = user.subscriptionUntil ? user.subscriptionUntil > now : false;

    return NextResponse.json({
      ok: true,
      user,
      subscriptionActive: active,
      subscriptionUntil: user.subscriptionUntil,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
