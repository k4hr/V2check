import { NextRequest } from "next/server";

export const runtime = "nodejs";

/**
 * GET/POST /api/createInvoice?plan=WEEK|MONTH|HALF|YEAR
 * Возвращает { ok, link } или { ok:false, error }.
 * Усилено: trim токена и проверка getMe для понятных ошибок.
 */
const RAW = process.env.BOT_TOKEN ?? "";
const TOKEN = RAW.trim();

const PRICES: Record<string, number> = {
  WEEK: 100,
  MONTH: 300,
  HALF: 1200,
  YEAR: 2000,
};

export async function GET(req: NextRequest) { return POST(req); }

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const plan = (searchParams.get("plan") || "MONTH").toUpperCase() as keyof typeof PRICES;
  const amount = PRICES[plan] ?? PRICES.MONTH;

  if (!TOKEN) {
    return Response.json({ ok: false, error: "BOT_TOKEN missing" }, { status: 500 });
  }

  try {
    const probe = await fetch(`https://api.telegram.org/bot${TOKEN}/getMe`);
    const probeJson = await probe.json();
    if (!probeJson?.ok) {
      return Response.json({ ok: false, error: "Invalid BOT_TOKEN (getMe failed)" }, { status: 401 });
    }
  } catch {
    return Response.json({ ok: false, error: "Bot API unreachable" }, { status: 502 });
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
    const data = await tg.json();
    if (!tg.ok || !data?.ok || !data?.result) {
      return Response.json({ ok: false, error: data?.description || "telegram error" }, { status: 500 });
    }
    return Response.json({ ok: true, link: data.result });
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || "fetch error" }, { status: 500 });
  }
}
