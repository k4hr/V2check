// app/tpay/start/route.ts
import { NextResponse } from 'next/server';
import { tpayInit, ensureEnv } from '@/lib/tpay';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    ensureEnv();

    const { searchParams } = new URL(req.url);
    const amount = Number(searchParams.get('amount') ?? 10000);
    const orderId = String(searchParams.get('orderId') ?? `TEST-${Date.now()}`);
    const description = String(searchParams.get('desc') ?? 'Тестовый платёж');

    const SuccessURL = String(process.env.TINKOFF_SUCCESS_URL ?? '');
    const FailURL = String(process.env.TINKOFF_FAIL_URL ?? '');

    // если нужен чек (для тестов 7–8)
    const withReceipt = searchParams.get('withReceipt') === '1';
    const receipt = withReceipt
      ? {
          Email: 'test@example.com',
          Taxation: 'usn_income',
          Items: [
            {
              Name: description,
              Quantity: 1.0,
              Amount: amount,
              Price: amount,
              PaymentMethod: 'full_prepayment',
              PaymentObject: 'service',
              Tax: 'none',
            },
          ],
        }
      : undefined;

    const data = await tpayInit({
      Amount: amount,
      OrderId: orderId,
      Description: description,
      SuccessURL,
      FailURL,
      ...(receipt ? { Receipt: receipt } : {}),
    } as any);

    if (!data.Success || !data.PaymentURL) {
      return NextResponse.json(
        { ok: false, error: data.Message || data.Details || data.ErrorCode || 'INIT_FAILED', raw: data },
        { status: 400 }
      );
    }

    // перенаправляем пользователя на платёжную страницу Т-Банка
    return NextResponse.redirect(data.PaymentURL);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'START_ERROR' }, { status: 500 });
  }
}
