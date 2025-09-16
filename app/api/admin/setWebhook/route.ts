// app/api/admin/setWebhook/route.ts
import { NextResponse, type NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN  = process.env.BOT_TOKEN  || process.env.TG_BOT_TOKEN  || '';
const ADMIN_KEY  = (process.env.ADMIN_KEY || '').trim();
const WH_SECRET  = (process.env.TG_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET || '').trim();

function normalize(str: string) {
  return (str || '').replace(/^["']|["']$/g, '').replace(/\r?\n/g, '').trim();
}

function getAdminKey(req: NextRequest) {
  const h = req.headers.get('x-admin-key');
  if (h) return normalize(h);
  const url = new URL(req.url);
  const q = url.searchParams.get('key') || url.searchParams.get('admin') || '';
  return normalize(q);
}

function getOrigin(req: NextRequest) {
  const proto = (req.headers.get('x-forwarded-proto') || 'https').split(',')[0].trim();
  const host  = (req.headers.get('x-forwarded-host')  || req.headers.get('host') || '').split(',')[0].trim();
  if (host) return `${proto}://${host}`;
  const url = new URL(req.url);
  return url.searchParams.get('origin') || '';
}

export async function POST(req: NextRequest) {
  try {
    if (!ADMIN_KEY) return NextResponse.json({ ok:false, error:'ADMIN_KEY_MISSING' }, { status:500 });
    if (!BOT_TOKEN) return NextResponse.json({ ok:false, error:'BOT_TOKEN_MISSING' }, { status:500 });

    const provided = getAdminKey(req);
    const origin   = getOrigin(req);
    const diag = { haveAdminEnv: !!ADMIN_KEY, providedLen: provided.length, envLen: ADMIN_KEY.length, origin };

    if (provided !== ADMIN_KEY) return NextResponse.json({ ok:false, error:'FORBIDDEN', diag }, { status:403 });
    if (!origin) return NextResponse.json({ ok:false, error:'ORIGIN_UNKNOWN', diag }, { status:400 });

    const webhookUrl = `${origin}/api/botWebhook`;
    const tgResp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message','pre_checkout_query','successful_payment'],
        drop_pending_updates: true,
        ...(WH_SECRET ? { secret_token: WH_SECRET } : {})
      })
    });

    const data = await tgResp.json().catch(() => null);
    return NextResponse.json({
      ok: tgResp.ok && data?.ok === true,
      used: { webhookUrl, withSecret: !!WH_SECRET },
      tg: data,
      diag
    }, { status:200 });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:e?.message || 'SERVER_ERROR' }, { status:500 });
  }
}

export const GET = POST;
