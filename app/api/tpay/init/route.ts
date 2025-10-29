// app/api/tpay/init/route.ts
import { NextResponse } from 'next/server';
import { ensureEnv, tpayInit } from '@/lib/tpay';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    ensureEnv();
    const json = await req.json().catch(() => ({}));
    const amount = Number(json?.amount ?? 10000); // 100 руб. по умолчанию
    const orderId = String(json?.orderId ?? `TEST-${Date.now()}`);
    const description = String(json?.description ?? 'Тестовый платеж');

    const SuccessURL = String(json?.successUrl ?? process.env.TINKOFF_SUCCESS_URL ?? '');
    const FailURL = String(json?.failUrl ?? process.env.TINKOFF_FAIL_URL ?? '');

    const data = await tpayInit({
      Amount: amount,
      OrderId: orderId,
      Description: description,
      SuccessURL,
      FailURL,
    });

    if (!data.Success) {
      return NextResponse.json({ ok: false, error: data.Message || data.Details || data.ErrorCode || 'INIT_FAILED', raw: data }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      paymentId: data.PaymentId,
      paymentUrl: data.PaymentURL,
      raw: data,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'INIT_ERROR' }, { status: 500 });
  }
}
