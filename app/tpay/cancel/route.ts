// app/api/tpay/cancel/route.ts
import { NextResponse } from 'next/server';
import { ensureEnv } from '@/lib/tpay';
import { callRaw } from '@/lib/tpay-extra'; // см. ниже

export const dynamic = 'force-dynamic';
export async function POST(req: Request) {
  try {
    ensureEnv();
    const { paymentId } = await req.json();
    if (!paymentId) return NextResponse.json({ ok:false, error:'MISSING_paymentId' }, { status:400 });
    const data = await callRaw('Cancel', { PaymentId: paymentId });
    return NextResponse.json({ ok: true, raw: data });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:e?.message||'CANCEL_ERROR' }, { status:500 });
  }
}
