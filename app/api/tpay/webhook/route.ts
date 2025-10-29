// app/api/tpay/webhook/route.ts
import { NextResponse } from 'next/server';
import { verifyWebhookToken } from '@/lib/tpay';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // Документация: https://www.tbank.ru/kassa/dev/payments/#callback
  const body = await req.json().catch(() => ({} as any));

  // Валидация подписи
  const okSig = verifyWebhookToken(body);
  if (!okSig) {
    return NextResponse.json({ ok: false, error: 'BAD_TOKEN' }, { status: 401 });
  }

  // Здесь ты обычно обновляешь заказ в БД по OrderId/PaymentId
  // Например:
  // const { Status, OrderId, PaymentId, Success, Amount } = body;

  // Пока просто логнём (Railway Logs)
  console.log('[TPAY WEBHOOK]', body);

  // Ответ 200 с пустым телом — OK для Tinkoff
  return NextResponse.json({ ok: true });
}
