"use client";

import { useEffect, useRef } from "react";
import { applyPlan } from "../subscription";

type Plan = "WEEK" | "MONTH" | "HALF" | "YEAR";

// Тексты на кнопках
const LABELS: Record<Plan, string> = {
  WEEK:  "7 дней — 29 ⭐️",
  MONTH: "30 дней — 99 ⭐️",
  HALF:  "Полгода — 499 ⭐️",
  YEAR:  "Год — 899 ⭐️",
};

function extractSlug(link: string): string | null {
  const m = /https?:\/\/t\.me\/(\$[A-Za-z0-9_-]+)/.exec(link);
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

    try { (window as any).location.href = link; } catch {}
  }

  async function buy(plan: Plan) {
    const SDK: any = (await import("@twa-dev/sdk")).default;
    const WebApp = (SDK?.WebApp || SDK || (window as any).Telegram?.WebApp);

    try {
      // ВАЖНО: сервер ждёт ?plan=... и POST
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

  function MenuItem({ plan }: { plan: Plan }) {
    return (
      <button
        onClick={() => buy(plan)}
        className="w-full bg-white/5 hover:bg-white/8 active:bg-white/10 transition rounded-xl px-5 py-4 flex items-center justify-between ring-1 ring-white/10 hover:ring-white/20 text-[18px]"
      >
        <span className="font-serif">⭐ {LABELS[plan]}</span>
        <span className="text-blue-500 text-2xl leading-none">›</span>
      </button>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B0B0F] text-white antialiased">
      <div className="max-w-md mx-auto px-5 pt-10 pb-24">
        <h1 className="text-4xl font-serif mb-6">Juristum Pro</h1>
        <p className="opacity-80 mb-6">Выберите тариф — окно Telegram-оплаты откроется сразу.</p>

        {/* Вертикальное меню: одна кнопка — одна строка */}
        <div className="flex flex-col gap-3">
          <MenuItem plan="WEEK" />
          <MenuItem plan="MONTH" />
          <MenuItem plan="HALF" />
          <MenuItem plan="YEAR" />
        </div>

        <p className="text-xs opacity-60 mt-10">
          Подтверждая, вы соглашаетесь с условиями подписки.
        </p>
      </div>
    </main>
  );
}
