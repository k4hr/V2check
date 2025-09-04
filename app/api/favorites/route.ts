import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { getTelegramUserId } from '../../../../lib/telegramAuth'

export async function GET(req: NextRequest) {
  try {
    const userId = await getTelegramUserId(req)
    const favorites = await prisma.favorite.findMany({
      where: { userId: Number(userId) },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({ ok: true, favorites })
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getTelegramUserId(req)
    const { title, url } = await req.json()
    const fav = await prisma.favorite.create({
      data: { userId: Number(userId), title, url }
    })
    return NextResponse.json({ ok: true, favorite: fav })
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getTelegramUserId(req)
    const { id } = await req.json()
    await prisma.favorite.deleteMany({
      where: { id: Number(id), userId: Number(userId) }
    })
    return NextResponse.json({ ok: true })
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
