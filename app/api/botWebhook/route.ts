import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

function addPeriod(base: Date, plan: 'WEEK'|'MONTH'|'YEAR') {
  const d = new Date(base)
  if (plan === 'WEEK')  d.setUTCDate(d.getUTCDate() + 7)
  if (plan === 'MONTH') d.setUTCMonth(d.getUTCMonth() + 1)
  if (plan === 'YEAR')  d.setUTCFullYear(d.getUTCFullYear() + 1)
  return d
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any))
  const msg = body?.message
  const sp  = msg?.successful_payment
  if (!sp) return NextResponse.json({ ok: true, skip: true })

  const payload: string = sp.invoice_payload ?? ''
  const plan = (payload.split(':')[1] ?? 'WEEK') as 'WEEK'|'MONTH'|'YEAR'
  const userId = String(msg?.from?.id ?? '')

  if (!userId) return NextResponse.json({ ok: false, error: 'no user' }, { status: 400 })

  const now = new Date()
  const prev = await prisma.user.findUnique({
    where: { telegramId: userId },
    select: { subscriptionUntil: true },
  })

  const startFrom = prev?.subscriptionUntil && prev.subscriptionUntil > now
    ? prev.subscriptionUntil
    : now

  const until = addPeriod(startFrom, plan)

  await prisma.user.upsert({
    where: { telegramId: userId },
    update: { subscriptionUntil: until },
    create: { telegramId: userId, subscriptionUntil: until },
  })

  return NextResponse.json({ ok: true, plan, until })
}
