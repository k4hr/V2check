"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { applyPlan } from "../lib/subscription"; // из app/lib/subscription

/**
 * Juristum Pro — оплата Telegram Stars по клику на тариф.
 * Сценарий из твоего рабочего архива + активация Pro через applyPlan(plan).
 *  1) POST /api/createInvoice?plan=WEEK|MONTH|HALF|YEAR -> { link: string }
 *  2) const WebApp = (await import("@twa-dev/sdk")).default
 *  3) WebApp.onEvent("invoiceClosed", cb); WebApp.openInvoice(link)
 *  4) при status === "paid" → applyPlan(plan)
 */

type ServerPlan = "WEEK" | "MONTH" | "HALF" | "YEAR";
type PlanKey = "week" | "month" | "half" | "year";

type Plan = {
  key: PlanKey;
  server: ServerPlan;
  label: string;
  stars: number;   // стоимость в звёздах
  months: number;  // для расчёта выгоды
};

// Базовая «месячная» стоимость в звёздах для расчёта выгоды
const MONTH_STARS = 300;

const PLANS: Plan[] = [
  { key: "week",  server: "WEEK",  label: "Неделя",  stars: 100,  months: 1/4.345 },
  { key: "month", server: "MONTH", label: "Месяц",   stars: 300,  months: 1 },
  { key: "half",  server: "HALF",  label: "Полгода", stars: 1200, months: 6 },
  { key: "year",  server: "YEAR",  label: "Год",     stars: 2000, months: 12 },
];

export default function ProStarsPage() {
  const [busyKey, setBusyKey] = useState<PlanKey | null>(null);

  useEffect(() => {
    try {
      const w: any = (window as any).Telegram?.WebApp;
      w?.ready?.();
      w?.expand?.();
    } catch {}
  }, []);

  const calcSavePct = (p: Plan) => {
    if (p.key === "half" || p.key === "year") {
      const ref = p.months * MONTH_STARS;
      const diff = Math.max(0, ref - p.stars);
      return Math.round((diff / ref) * 100);
    }
    return 0;
  };

  const pay = async (p: Plan) => {
    if (busyKey) return;
    setBusyKey(p.key);
    try {
      // 1) создать инвойс на сервере
      const res = await fetch(`/api/createInvoice?plan=${p.server}`, { method: "POST" });
      const data = await res.json();
      if (!data?.link) {
        alert("Не удалось создать счёт. Попробуйте позже.");
        setBusyKey(null);
        return;
      }

      // 2) подключить Telegram SDK
      const WebApp: any = (await import("@twa-dev/sdk")).default;

      // 3) слушать закрытие окна оплаты (поведение как в твоём архиве)
      WebApp.onEvent("invoiceClosed", async (e: any) => {
        const status = e?.status;
        console.log("invoiceClosed:", status);
        setBusyKey(null);
        if (status === "paid") {
          try {
            applyPlan(p.server); // локально активируем Pro
          } catch {}
          WebApp?.showPopup?.({ title: "Готово", message: "Оплата прошла успешно. Pro активирована." });
        } else if (status === "failed") {
          WebApp?.showPopup?.({ title: "Ошибка", message: "Оплата не прошла." });
        }
      });

      // 4) открыть окно оплаты
      WebApp.openInvoice(data.link);
    } catch (e) {
      console.error(e);
      setBusyKey(null);
      alert("Ошибка оплаты. Попробуйте ещё раз.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B4DFF] bg-[radial-gradient(800px_400px_at_50%_-120px,rgba(255,255,255,0.16),transparent)] text-white antialiased">
      <div className="max-w-md mx-auto px-5 pt-10 pb-24">
        {/* Шапка */}
        <div className="flex items-center gap-4 mb-6">
          <div className="h-12 w-12 rounded-2xl overflow-hidden ring-1 ring-white/30 shadow-lg bg-white/10 backdrop-blur">
            <Image src="/juristum-logo.jpg" alt="Juristum" width={96} height={96} className="h-full w-full object-cover" priority />
          </div>
          <div>
            <div className="text-sm/5 text-white/70">Juristum</div>
            <h1 className="text-2xl font-semibold tracking-tight">Juristum Pro</h1>
          </div>
        </div>

        {/* Блок тарифов */}
        <div className="rounded-3xl bg-white/10 ring-1 ring-white/25 shadow-2xl overflow-hidden">
          <div className="px-5 pt-5 pb-2">
            <p className="text-sm text-white/80">
              Выберите период подписки. Оплата — <b>Telegram Stars</b>.
            </p>
          </div>

          <div className="px-3 pb-3">
            <ul className="list-none p-0 m-0 space-y-3">
              {PLANS.map((p) => {
                const pct = calcSavePct(p);
                const busy = busyKey === p.key;
                return (
                  <li key={p.key}>
                    <button
                      onClick={() => pay(p)}
                      disabled={busy}
                      className={[
                        "group w-full flex items-center justify-between rounded-2xl px-4 py-4 transition shadow-sm",
                        "bg-white text-[#0B0F14] hover:opacity-95 disabled:opacity-70",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl flex items-center justify-center ring-1 bg-[#0B4DFF]/10 ring-[#0B4DFF]/20 text-[#0B4DFF]">
                          {p.key === "week" && "7"}
                          {p.key === "month" && "M"}
                          {p.key === "half" && "6M"}
                          {p.key === "year" && "12M"}
                        </div>
                        <span className="text-base font-medium">{p.label}</span>
                        {pct > 0 && (
                          <span className="ml-2 rounded-lg px-2 py-1 text-[11px] font-medium tracking-tight bg-emerald-400/15 text-emerald-100 ring-1 ring-emerald-300/25">
                            −{pct}% выгоднее
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 font-semibold tracking-tight">
                        <span className="text-[#0B0F14]">{busy ? "…" : p.stars}</span>
                        <span className="text-[#0B0F14]" aria-hidden="true">⭐</span>
                      </div>
                    </button>
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
