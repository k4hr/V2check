// app/api/tpay/refund/route.ts
import { NextResponse } from 'next/server';
import { ensureEnv } from '@/lib/tpay';
import { callRaw } from '@/lib/tpay-extra';

export const dynamic = 'force-dynamic';
export async function POST(req: Request) {
  try {
    ensureEnv();
    const { paymentId, amount } = await req.json();
    if (!paymentId) return NextResponse.json({ ok:false, error:'MISSING_paymentId' }, { status:400 });
    const data = await callRaw('Refund', { PaymentId: paymentId, Amount: amount }); // полная сумма — полный возврат
    return NextResponse.json({ ok: true, raw: data });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:e?.message||'REFUND_ERROR' }, { status:500 });
  }
}
