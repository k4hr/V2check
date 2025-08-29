"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

/**
 * Оплата по клику на тариф:
 * - создаём инвойс на бекенде: POST /api/createInvoice?plan=...
 * - открываем Telegram WebApp.openInvoice(link)
 * - обрабатываем закрытие окна оплаты (paid/cancelled/failed)
 * Требуется существующий API-роут /api/createInvoice и пакет @twa-dev/sdk.
 */

type PlanKey = "week" | "month" | "half" | "year";
type ServerPlan = "WEEK" | "MONTH" | "HALF" | "YEAR";

const MONTH_PRICE = 99;

const plans: Record<PlanKey, { label: string; months: number; price: number; server: ServerPlan }> = {
  week:  { label: "Неделя",  months: 1 / 4.345, price: 29,  server: "WEEK" },
  month: { label: "Месяц",   months: 1,          price: 99,  server: "MONTH" },
  half:  { label: "Полгода", months: 6,          price: 499, server: "HALF" },
  year:  { label: "Год",     months: 12,         price: 899, server: "YEAR" },
};

const order: PlanKey[] = ["week", "month", "half", "year"];

export default function Page() {
  const [busy, setBusy] = useState<PlanKey | null>(null);

  const savings = (plan: PlanKey) => {
    const p = plans[plan];
    if (plan === "half" || plan === "year") {
      const ref = p.months * MONTH_PRICE;
      const diff = Math.max(0, ref - p.price);
      const pct = Math.round((diff / ref) * 100);
      return { diff: Math.round(diff), pct };
    }
    return null;
  };

  useEffect(() => {
    try {
      const w: any = (window as any).Telegram?.WebApp;
      w?.ready?.();
      w?.expand?.();
    } catch {}
  }, []);

  const pay = async (plan: PlanKey) => {
    if (busy) return;
    setBusy(plan);
    try {
      const sdk = await import("@twa-dev/sdk");
      const WebApp = sdk.default.WebApp || (sdk as any).WebApp || (window as any).Telegram?.WebApp;

      // Сообщим боту о выборе (не обязательно, но полезно для аналитики)
      try { WebApp?.sendData?.(JSON.stringify({ action: "buy", plan })); } catch {}

      // Создаём инвойс на бекенде
      const resp = await fetch(`/api/createInvoice?plan=${plans[plan].server}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!resp.ok) throw new Error("Failed to create invoice");
      const data = await resp.json(); // ожидаем { link: string }

      // Откроем окно покупки
      WebApp?.openInvoice?.(data.link, (status: string) => {
        // "paid" | "cancelled" | "failed" | "pending"
        console.log("invoiceClosed:", status);
        setBusy(null);
        if (status === "paid") {
          WebApp?.showPopup?.({ title: "Готово", message: "Оплата прошла успешно." });
        }
      });

      // На всякий случай — фолбэк
      if (!WebApp?.openInvoice) {
        window.location.href = data.link;
      }
    } catch (e) {
      console.error(e);
      setBusy(null);
      alert("Не удалось открыть оплату. Попробуйте ещё раз.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B4DFF] bg-[radial-gradient(800px_400px_at_50%_-120px,rgba(255,255,255,0.16),transparent)] text-white antialiased">
      <div className="max-w-md mx-auto px-5 pt-10 pb-24">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-12 w-12 rounded-2xl overflow-hidden ring-1 ring-white/30 shadow-lg bg-white/10 backdrop-blur">
            <Image src="/juristum-logo.jpg" alt="Juristum" width={96} height={96} className="h-full w-full object-cover" priority />
          </div>
          <div>
            <div className="text-sm/5 text-white/70">Juristum</div>
            <h1 className="text-2xl font-semibold tracking-tight">Juristum Pro</h1>
          </div>
        </div>

        <div className="rounded-3xl bg-white/10 ring-1 ring-white/25 shadow-2xl overflow-hidden">
          <div className="px-5 pt-5 pb-2">
            <p className="text-sm text-white/80">
              Выберите период подписки. Цены фиксированы. Для «Полгода» и «Год» показываем выгоду.
            </p>
          </div>

          <div className="px-3 pb-3">
            <ul className="list-none p-0 m-0 space-y-3">
              {order.map((key) => {
                const p = plans[key];
                const save = savings(key);
                const isBusy = busy === key;
                return (
                  <li key={key}>
                    <button
                      onClick={() => pay(key)}
                      disabled={isBusy}
                      className={[
                        "group w-full flex items-center justify-between rounded-2xl px-4 py-4 transition shadow-sm",
                        "bg-white text-[#0B0F14] hover:opacity-95 disabled:opacity-70",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl flex items-center justify-center ring-1 bg-[#0B4DFF]/10 ring-[#0B4DFF]/20 text-[#0B4DFF]">
                          {key === "week" && "7"}
                          {key === "month" && "M"}
                          {key === "half" && "6M"}
                          {key === "year" && "12M"}
                        </div>
                        <span className="text-base font-medium">{p.label}</span>
                        {save && (
                          <span className="ml-2 rounded-lg px-2 py-1 text-[11px] font-medium tracking-tight bg-emerald-400/15 text-emerald-100 ring-1 ring-emerald-300/25">
                            −{save.pct}% выгоднее
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1 font-semibold tracking-tight">
                        <span className="text-[#0B0F14]">{isBusy ? "…" : p.price}</span>
                      </div>
                    </button>
                    {save && (
                      <div className="px-1 pt-1 text-[11px] text-white/70">
                        Экономия {save.diff} по сравнению с {formatRef(p.months)}.
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            <p className="text-center text-[11px] text-white/70 mt-5">
              Подтверждая, вы соглашаетесь с условиями подписки.
            </p>
          </div>
        </div>

        <div className="text-center text-[11px] text-white/70 mt-6">Поддержка: @juristum_support</div>
      </div>
    </div>
  );
}

function formatRef(months: number) {
  const n = Number.isInteger(months) ? String(months) : months.toFixed(1).replace(/\.0(\b|$)/, "");
  return `месяц × ${n}`;
}
