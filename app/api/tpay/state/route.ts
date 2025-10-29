// app/api/tpay/state/route.ts
import { NextResponse } from 'next/server';
import { ensureEnv, tpayGetState } from '@/lib/tpay';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    ensureEnv();
    const u = new URL(req.url);
    const paymentId = u.searchParams.get('paymentId');
    if (!paymentId) {
      return NextResponse.json({ ok: false, error: 'MISSING_paymentId' }, { status: 400 });
    }
    const data = await tpayGetState(paymentId);
    return NextResponse.json({ ok: true, raw: data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'STATE_ERROR' }, { status: 500 });
  }
}
