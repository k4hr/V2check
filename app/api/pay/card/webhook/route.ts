/* path: app/api/pay/card/webhook/route.ts */
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const event = await req.json();               // { event, object: { id, status, ... }, ... }
    const id = event?.object?.id as string | undefined;
    if (!id) return NextResponse.json({ ok:true }); // игнорим мусор

    // проверяем статус у ЮKassa (а не верим телу вебхука)
    const shopId = process.env.YK_SHOP_ID!;
    const secret = process.env.YK_SECRET_KEY!;
    const auth = Buffer.from(`${shopId}:${secret}`).toString('base64');

    const r = await fetch(`https://api.yookassa.ru/v3/payments/${id}`, {
      headers: { 'Authorization': `Basic ${auth}` },
      cache: 'no-store',
    });
    const data = await r.json();

    if (data?.status === 'succeeded') {
      // TODO: отметить оплату в БД, выдать доступ.
      // const meta = data?.metadata; // tier, plan — мы записали их при создании платежа
    }

    return NextResponse.json({ ok:true });
  } catch {
    // ЮKassa хочет 200 OK, иначе будет ретраить
    return NextResponse.json({ ok:true });
  }
}
