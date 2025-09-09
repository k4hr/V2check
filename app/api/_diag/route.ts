// app/api/_diag/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getTelegramId, getTelegramIdStrict } from '@/lib/auth/verifyInitData'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const telegramIdSoft = await getTelegramId(req)
    const telegramIdHard = await getTelegramIdStrict(req).catch(() => null)

    let user: any = null
    if (telegramIdSoft) {
      user = await prisma.user.findUnique({
        where: { telegramId: telegramIdSoft },
        select: {
          id: true,
          telegramId: true,
          subscriptionUntil: true,
          createdAt: true
        },
      })
    }

    return NextResponse.json({
      ok: true,
      telegramIdSoft,
      telegramIdHard,
      user,
      envSample: {
        hasBotToken: !!(process.env.TG_BOT_TOKEN || process.env.BOT_TOKEN),
      },
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 })
  }
}
