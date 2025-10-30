// app/tpay/start/route.ts
import { NextResponse } from 'next/server';
import { ensureEnv, tpayInit } from '@/lib/tpay';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    ensureEnv();

    const url = new URL(req.url);
    const amount = Number(url.searchParams.get('amount') ?? 10000); // копейки
    const description = String(url.searchParams.get('desc') ?? 'Test payment');
    const orderId = String(url.searchParams.get('orderId') ?? `TEST-${Date.now()}`);
    const withReceipt = url.searchParams.get('withReceipt') === '1';

    const origin = url.origin;
    const SuccessURL =
      url.searchParams.get('successUrl') ??
      process.env.TINKOFF_SUCCESS_URL ??
      `${origin}/tpay/success`;
    const FailURL =
      url.searchParams.get('failUrl') ??
      process.env.TINKOFF_FAIL_URL ??
      `${origin}/tpay/fail`;

    const Receipt = withReceipt
      ? {
          Email: 'test@example.com',
          Taxation: 'usn_income',
          Items: [
            {
              Name: description || 'Подписка',
              Price: amount,
              Quantity: 1.0,
              Amount: amount,
              Tax: 'none',
              PaymentMethod: 'full_prepayment',
              PaymentObject: 'service',
            },
          ],
        }
      : undefined;

    const data = await tpayInit({
      Amount: amount,
      OrderId: orderId,
      Description: description,
      SuccessURL: String(SuccessURL),
      FailURL: String(FailURL),
      ...(Receipt ? { Receipt } : {}),
    });

    if (!data?.Success || !data?.PaymentURL) {
      const msg = data?.Message || data?.Details || data?.ErrorCode || 'INIT_FAILED';
      return NextResponse.json({ ok: false, error: msg, raw: data }, { status: 400 });
    }

    return NextResponse.redirect(data.PaymentURL, 302);
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'INIT_ERROR' },
      { status: 500 }
    );
  }
}
