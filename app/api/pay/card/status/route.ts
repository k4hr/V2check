/* path: app/api/pay/card/status/route.ts */
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ ok:false, error:'NO_ID' }, { status:400 });

    const shopId = process.env.YK_SHOP_ID!;
    const secret = process.env.YK_SECRET_KEY!;
    const auth = Buffer.from(`${shopId}:${secret}`).toString('base64');

    const r = await fetch(`https://api.yookassa.ru/v3/payments/${id}`, {
      headers: { 'Authorization': `Basic ${auth}` }
    });
    const data = await r.json();
    if (!r.ok) return NextResponse.json({ ok:false, error:data?.description || 'FETCH_FAILED', details:data }, { status:400 });

    return NextResponse.json({ ok:true, status:data.status, payment:data });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:String(e?.message||e) }, { status:500 });
  }
}
