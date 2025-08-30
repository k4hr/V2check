import { NextRequest } from "next/server";

export const runtime = "nodejs";

/**
 * GET/POST /api/createInvoice?plan=WEEK|MONTH|HALF|YEAR
 * Returns detailed JSON: { ok, link?, error?, detail? }
 * Requires env BOT_TOKEN (Telegram bot token).
 */
const TOKEN = process.env.BOT_TOKEN || "";

const PRICES: Record<string, number> = {
  WEEK: 100,
  MONTH: 300,
  HALF: 1200,
  YEAR: 2000,
};

export async function GET(req: NextRequest) {
  // allow GET in browser for diagnostics
  return POST(req);
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const plan = (searchParams.get("plan") || "MONTH").toUpperCase();
  const amount = PRICES[plan] ?? PRICES.MONTH;

  if (!TOKEN) {
    return Response.json({ ok: false, error: "BOT_TOKEN is not set on server" }, { status: 500 });
  }

  const body = {
    title: `Juristum Pro — ${plan}`,
    description: `Подписка Juristum Pro (${plan})`,
    payload: `plan:${plan}`,
    currency: "XTR",
    prices: [{ label: plan, amount }],
  };

  try {
    const tg = await fetch(`https://api.telegram.org/bot${TOKEN}/createInvoiceLink`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const status = tg.status;
    let data: any = null;
    try { data = await tg.json(); } catch {}

    if (!tg.ok || !data?.ok || !data?.result) {
      return Response.json({
        ok: false,
        error: data?.description || `telegram http ${status}`,
        detail: { status, plan, amount, data },
      }, { status: 500 });
    }

    return Response.json({ ok: true, link: data.result, detail: { plan, amount } });
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || "fetch error" }, { status: 500 });
  }
}
