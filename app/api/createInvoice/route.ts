import type { NextRequest } from "next/server";

type Plan = "WEEK" | "MONTH" | "HALF" | "YEAR";

// Новые цены в ЗВЁЗДАХ (Stars)
const AMOUNTS: Record<Plan, number> = {
  WEEK: 29,    // 7 дней — 29 ⭐️
  MONTH: 99,   // 30 дней — 99 ⭐️
  HALF: 499,   // Полгода — 499 ⭐️
  YEAR: 899,   // Год — 899 ⭐️
};

const TITLES: Record<Plan, string> = {
  WEEK:  "Juristum Pro — 7 дней",
  MONTH: "Juristum Pro — 30 дней",
  HALF:  "Juristum Pro — Полгода",
  YEAR:  "Juristum Pro — Год",
};

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const plan = (url.searchParams.get("plan") || "") as Plan;
    if (!["WEEK", "MONTH", "HALF", "YEAR"].includes(plan)) {
      return Response.json({ ok: false, error: "Bad plan" }, { status: 400 });
    }

    const BOT_TOKEN = process.env.BOT_TOKEN;
    if (!BOT_TOKEN) {
      return Response.json({ ok: false, error: "BOT_TOKEN is not set on server" }, { status: 500 });
    }

    // Формируем запрос к Telegram Bot API
    const tgUrl = `https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`;

    const body = {
      title: TITLES[plan],
      description: "Оплата подписки Juristum Pro (звёздами)",
      payload: `plan:${plan}`,
      currency: "XTR", // Telegram Stars
      prices: [{ label: TITLES[plan], amount: AMOUNTS[plan] }], // amount = звёзды
    };

    const resp = await fetch(tgUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await resp.json().catch(() => ({}));
    if (!data?.ok || !data?.result) {
      return Response.json(
        { ok: false, error: "createInvoiceLink failed", detail: data },
        { status: 500 }
      );
    }

    const link: string = data.result as string;
    return Response.json({ ok: true, link });
  } catch (e: any) {
    return Response.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
