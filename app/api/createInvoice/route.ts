import { NextRequest } from 'next/server';

const TOKEN = process.env.BOT_TOKEN || "8230866019:AAGB67O2IlCFJ1AGvenkvGAdbBzqxNplWEg";

const PRICES: Record<string, number> = {
  'WEEK': 100,
  'MONTH': 300,
  'HALF': 1200,
  'YEAR': 2000
};

export async function POST(req: NextRequest){
  if(!TOKEN) return Response.json({ok:false, error:'BOT_TOKEN is missing'}, {status:500});
  const { searchParams } = new URL(req.url);
  const plan = searchParams.get('plan') || 'MONTH';
  const amount = PRICES[plan] ?? PRICES['MONTH'];

  const body = {
    title: `PravoGo Pro — ${plan}`,
    description: `Доступ без лимитов (${plan}).`,
    payload: JSON.stringify({plan, ts: Date.now(), nonce: Math.random().toString(36).slice(2)}),
    currency: "XTR",
    prices: [{ label: `PravoGo Pro ${plan}`, amount }]
  };

  try{
    const tg = await fetch(`https://api.telegram.org/bot${TOKEN}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await tg.json();
    if (!data.ok) return Response.json({ok:false, error:data.description || 'tg error'}, {status:500});
    return Response.json({ok:true, link:data.result});
  }catch(e:any){
    return Response.json({ok:false, error:e?.message || 'fetch error'}, {status:500});
  }
}
