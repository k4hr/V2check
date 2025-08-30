import { NextRequest } from "next/server";

// Force Node.js runtime on Railway (not Edge)
export const runtime = "nodejs";

/**
 * POST /api/createInvoice?plan=WEEK|MONTH|HALF|YEAR
 * Returns: { ok: boolean, link?: string, error?: string }
 * Requires: env BOT_TOKEN with Telegram bot token
 */
const TOKEN = process.env.BOT_TOKEN || "";

const PRICES: Record<string, number> = {
  WEEK: 100,
  MONTH: 300,
  HALF: 1200,
  YEAR: 2000,
};

export async function POST(req: NextRequest) {
  if (!TOKEN) {
    return Response.json({ ok: false, error: "BOT_TOKEN is missing" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const plan = (searchParams.get("plan") || "MONTH").toUpperCase();
  const amount = PRICES[plan] ?? PRICES.MONTH;

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
      }, { status: 500 });
    }

    return Response.json({ ok: true, link: data.result });
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || "fetch error" }, { status: 500 });
  }
}
