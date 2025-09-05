// app/api/botWebhook/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

type Add = { days?: number; weeks?: number; months?: number; years?: number }

// Локальная утилита вместо date-fns/add — чтобы не тянуть зависимость
function addDuration(base: Date, add: Add): Date {
  const d = new Date(base)
  if (add.years)  d.setFullYear(d.getFullYear() + (add.years || 0))
  if (add.months) d.setMonth(d.getMonth() + (add.months || 0))
  const dayDelta = (add.days || 0) + (add.weeks || 0) * 7
  if (dayDelta) d.setDate(d.getDate() + dayDelta)
  return d
}

// Простейший вебхук: ожидаем Telegram update с successful_payment
export async function POST(req: Request) {
  try {
    const update = await req.json() as any

    // логика фильтрации
    const sp = update?.message?.successful_payment
    if (!sp) return NextResponse.json({ ok: true, skipped: true })

    const userId = String(update?.message?.from?.id || update?.message?.chat?.id)
    if (!userId) return NextResponse.json({ ok: false, error: 'NO_USER' }, { status: 400 })

    // На основании payload определяем длительность
    const payload: string = sp?.invoice_payload || ''
    // допустим payload вида "subs:WEEK" | "subs:MONTH" | "subs:YEAR"
    let add: Add = { days: 7 }
    if (payload.endsWith('MONTH')) add = { months: 1 }
    else if (payload.endsWith('YEAR')) add = { years: 1 }
    else if (payload.endsWith('WEEK')) add = { days: 7 }

    const now = new Date()
    const prev = await prisma.user.findUnique({
      where: { telegramId: userId },
      select: { subscriptionUntil: true },
    })

    const base = prev?.subscriptionUntil && prev.subscriptionUntil > now
      ? prev.subscriptionUntil
      : now

    const until = addDuration(base, add)

    await prisma.user.upsert({
      where: { telegramId: userId },
      update: { subscriptionUntil: until },
      create: { telegramId: userId, subscriptionUntil: until },
    })

    return NextResponse.json({ ok: true, userId, until })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}
