"use client";

import { useEffect, useRef } from "react";
import { applyPlan } from "../subscription";

type Plan = "WEEK" | "MONTH" | "HALF" | "YEAR";

const UI: Record<Plan, { label: string; price: number }> = {
  WEEK:  { label: "Неделя",  price: 100 },
  MONTH: { label: "Месяц",   price: 300 },
  HALF:  { label: "Полгода", price: 1200 },
  YEAR:  { label: "Год",     price: 2000 },
};

function extractSlug(link: string): string | null {
  const m = /https?:\\/\\/t\.me\\/(\$[A-Za-z0-9_\-]+)/.exec(link);
  return m ? m[1] : null;
}

export default function ProPage() {
  const listenerReady = useRef(false);

  useEffect(() => {
    (async () => {
      const SDK: any = (await import("@twa-dev/sdk")).default;
      const WebApp = (SDK?.WebApp || SDK || (window as any).Telegram?.WebApp);
      if (!WebApp) return;
      try { WebApp.ready(); WebApp.expand(); } catch {}
      if (listenerReady.current) return;
      WebApp.onEvent("invoiceClosed", async (ev: any) => {
        const status = ev?.status;
        if (status === "paid") {
          try {
            const p = /plan%3A([A-Z]+)/.exec(String(ev?.url || ""))?.[1] as Plan | undefined;
            if (p) await applyPlan(p);
          } catch {}
          WebApp.showAlert("Оплата прошла! Доступ открыт.");
          try { WebApp.close(); } catch {}
        } else if (status === "canceled") {
          WebApp.showAlert("Покупка отменена.");
        } else {
          WebApp.showAlert("Ошибка оплаты. Попробуйте ещё раз.");
        }
      });
      listenerReady.current = true;
    })();
  }, []);

  async function openInvoiceSmart(link: string) {
    const SDK: any = (await import("@twa-dev/sdk")).default;
    const WebApp = (SDK?.WebApp || SDK || (window as any).Telegram?.WebApp);
    const slug = extractSlug(link);

    try {
      const r = WebApp.openInvoice(link, () => {});
      if (r === true) return;
    } catch {}

    if (slug) {
      try {
        const r2 = WebApp.openInvoice(slug, () => {});
        if (r2 === true) return;
      } catch {}
    }

    try { WebApp.openTelegramLink(link); return; } catch {}

    try { window.location.href = link; } catch {}
  }

  async function buy(plan: Plan) {
    const SDK: any = (await import("@twa-dev/sdk")).default;
    const WebApp = (SDK?.WebApp || SDK || (window as any).Telegram?.WebApp);

    try {
      const resp = await fetch(`/api/createInvoice?plan=${plan}`, { method: "POST" });
      const data = await resp.json();
      if (!data?.ok || !data?.link) {
        WebApp?.showAlert?.(`Не удалось создать счёт: ${data?.error || "unknown"}`);
        return;
      }
      await openInvoiceSmart(data.link);
    } catch (e: any) {
      WebApp?.showAlert?.(`Сеть недоступна: ${e?.message || e}`);
    }
  }

  function PlanRow({ p }: { p: Plan }) {
    const { label, price } = UI[p];
    return (
      <button
        onClick={() => buy(p)}
        className="w-full group flex items-center justify-between rounded-3xl px-5 py-5 bg-white/5 hover:bg-white/8 active:bg-white/10 transition ring-1 ring-white/10 hover:ring-white/20 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-white/10 grid place-items-center ring-1 ring-white/15">⭐</div>
          <div className="text-left">
            <div className="text-[18px] font-serif">{label}</div>
            <div className="text-[12px] opacity-70">Оплата звёздами</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-[16px] font-medium tabular-nums">{price} ⭐</div>
          <svg className="h-5 w-5 opacity-60 group-hover:opacity-100 transition" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 18l6-6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B0B0F] text-white antialiased">
      <div className="max-w-md mx-auto px-5 pt-10 pb-24">
        <h1 className="text-4xl font-serif mb-6">Juristum Pro</h1>
        <p className="opacity-80 mb-6">Выберите тариф — окно Telegram-оплаты откроется сразу.</p>

        <div className="space-y-4">
          <PlanRow p="WEEK" />
          <PlanRow p="MONTH" />
          <PlanRow p="HALF" />
          <PlanRow p="YEAR" />
        </div>

        <p className="text-xs opacity-60 mt-10">
          Подтверждая, вы соглашаетесь с условиями подписки.
        </p>
      </div>
    </main>
  );
}
