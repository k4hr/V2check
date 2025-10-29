// path: app/tpay/start/route.ts
import { NextResponse } from 'next/server';
import { ensureEnv, tpayInit } from '@/lib/tpay';

export const dynamic = 'force-dynamic';

/**
 * GET /tpay/start
 * Открывает платёжную форму в один клик (302 редирект на PaymentURL).
 *
 * Параметры (query):
 *  - amount        — сумма в копейках (по умолчанию 10000 = 100 ₽)
 *  - desc          — описание платежа
 *  - orderId       — номер заказа (если не передан, сгенерируется)
 *  - successUrl    — кастомный URL успеха (иначе берётся из env или /tpay/success)
 *  - failUrl       — кастомный URL ошибки (иначе из env или /tpay/fail)
 *  - withReceipt   — '1' чтобы приложить чек для теста №7
 */
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

    // При необходимости сформируем простой чек (хватает для тестов №7/№8)
    const Receipt = withReceipt
      ? {
          Email: 'test@example.com', // тестовый получатель чека (для формальностей)
          Taxation: 'usn_income',    // система налогообложения (любая валидная)
          Items: [
            {
              Name: description || 'Подписка',
              Price: amount,         // копейки
              Quantity: 1.0,
              Amount: amount,
              Tax: 'none',           // без НДС
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

    // 302 на форму оплаты — корректно работает в Safari/Telegram/VK вебвью.
    return NextResponse.redirect(data.PaymentURL, 302);
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'INIT_ERROR' },
      { status: 500 },
    );
  }
}
