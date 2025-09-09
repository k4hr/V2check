// app/api/favorites/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getTelegramIdStrict } from '@/lib/auth/verifyInitData'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const telegramId = await getTelegramIdStrict(req)
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: { id: true },
    })
    if (!user) return NextResponse.json({ ok: true, items: [] })

    const items = await prisma.favorite.findMany({
      where: { userId: user.id },
      orderBy: { id: 'desc' },
      select: { id: true, code: true, text: true, note: true },
    })

    return NextResponse.json({ ok: true, items })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 400 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const telegramId = await getTelegramIdStrict(req)
    const { code, text, note } = await req.json()
    const user = await prisma.user.upsert({
      where: { telegramId },
      create: { telegramId },
      update: {},
      select: { id: true },
    })
    await prisma.favorite.create({ data: { userId: user.id, code, text, note } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const telegramId = await getTelegramIdStrict(req)
    const { id } = await req.json()
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: { id: true },
    })
    if (!user) return NextResponse.json({ ok: true })

    // id comes from client; ensure string
    await prisma.favorite.deleteMany({ where: { id: String(id), userId: user.id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 400 })
  }
}
