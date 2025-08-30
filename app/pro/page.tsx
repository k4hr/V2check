// app/pro/page.tsx
"use client";

import React from "react";

// Локальная таблица тарифов
const PLANS = {
  WEEK:  { title: "⭐ 7 дней — 29 ⭐",   code: "WEEK"  as const },
  MONTH: { title: "⭐ 30 дней — 99 ⭐",  code: "MONTH" as const },
  HALF:  { title: "⭐ Полгода — 499 ⭐", code: "HALF"  as const },
  YEAR:  { title: "⭐ Год — 899 ⭐",     code: "YEAR"  as const },
};
type PlanKey = keyof typeof PLANS;

// Достаём slug из ссылки https://t.me/$XXXX
function extractInvoiceSlug(link: string): string | null {
  try {
    const m = /https?:\/\/t\.me\/(\$[A-Za-z0-9_\-]+)/.exec(link);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

export default function ProPage() {
  const onBuy = async (planKey: PlanKey) => {
    // ✅ динамический импорт, чтобы не падать на сервере
    const { default: WebApp } = await import("@twa-dev/sdk");
    const plan = PLANS[planKey].code;

    try {
      const res = await fetch("/api/createInvoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const json = await res.json();

      if (!json?.ok) {
        const msg =
          json?.error || json?.detail?.description || "Не удалось создать счёт";
        WebApp.showAlert?.(msg);
        return;
      }

      const link: string = json.link;
      const slug = extractInvoiceSlug(link);

      if (slug && WebApp.openInvoice) {
        WebApp.openInvoice(slug);
        return;
      }
      if (WebApp.openLink) WebApp.openLink(link);
      else if (typeof window !== "undefined") window.location.href = link;
    } catch (e) {
      const { default: WebApp } = await import("@twa-dev/sdk");
      WebApp.showAlert?.("Ошибка оплаты. Попробуйте ещё раз.");
      console.error(e);
    }
  };

  // Кнопки в стиле главного меню — по одной в строке
  const Item: React.FC<{ children: React.ReactNode; onClick: () => void }> = ({
    children,
    onClick,
  }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between rounded-2xl bg-white/5 hover:bg-white/7.5 transition-colors ring-1 ring-white/10 px-4 py-4 text-left shadow-sm"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">⭐</span>
        <span className="text-lg font-semibold text-white/90">{children}</span>
      </div>
      <span className="text-white/40 text-2xl">›</span>
    </button>
  );

  return (
    <div className="min-h-screen text-white antialiased">
      <div className="max-w-md mx-auto px-4 pt-8 pb-24">
        <h1 className="text-4xl font-bold mb-6">Juristum Pro</h1>
        <p className="text-white/80 mb-5">
          Выберите тариф — окно Telegram-оплаты откроется сразу.
        </p>

        <div className="space-y-3">
          <Item onClick={() => onBuy("WEEK")}>{PLANS.WEEK.title}</Item>
          <Item onClick={() => onBuy("MONTH")}>{PLANS.MONTH.title}</Item>
          <Item onClick={() => onBuy("HALF")}>{PLANS.HALF.title}</Item>
          <Item onClick={() => onBuy("YEAR")}>{PLANS.YEAR.title}</Item>
        </div>

        <p className="mt-8 text-white/70">
          Подтверждая, вы соглашаетесь с условиями подписки.
        </p>
      </div>
    </div>
  );
}
