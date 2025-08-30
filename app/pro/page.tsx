"use client";

import { useEffect, useRef } from "react";
import { applyPlan } from "@/app/subscription";

type Plan = "WEEK" | "MONTH" | "HALF" | "YEAR";

const UI = {
  WEEK:  { label: "Неделя",  price: 100 },
  MONTH: { label: "Месяц",   price: 300 },
  HALF:  { label: "Полгода", price: 1200 },
  YEAR:  { label: "Год",     price: 2000 },
} as const;

export default function ProPage() {
  const listenerReady = useRef(false);

  useEffect(() => {
    const attach = async () => {
      if (listenerReady.current) return;
      const SDK: any = (await import("@twa-dev/sdk")).default;
      const WebApp = (SDK?.WebApp || SDK || (window as any).Telegram?.WebApp);
      if (!WebApp) return;

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
    };
    attach();
  }, []);

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
      WebApp.openInvoice(data.link);
    } catch (e: any) {
      WebApp?.showAlert?.(`Сеть недоступна: ${e?.message || e}`);
    }
  }

  return (
    <main className="min-h-screen bg-[#0B0B0F] text-white antialiased">
      <div className="max-w-md mx-auto px-5 pt-10 pb-24">
        <h1 className="text-4xl font-serif mb-6">Juristum Pro</h1>
        <p className="opacity-80 mb-6">Выберите тариф — окно Telegram-оплаты откроется сразу.</p>

        <div className="flex flex-wrap gap-3">
          {(Object.keys(UI) as Plan[]).map((p) => (
            <button
              key={p}
              onClick={() => buy(p)}
              className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/15 transition ring-1 ring-white/20"
            >
              {UI[p].label} — {UI[p].price} ⭐
            </button>
          ))}
        </div>

        <p className="text-xs opacity-60 mt-10">
          Подтверждая, вы соглашаетесь с условиями подписки.
        </p>
      </div>
    </main>
  );
}
