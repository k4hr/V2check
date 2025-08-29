"use client";

import Image from "next/image";
import { useState } from "react";

type PlanKey = "week" | "month" | "half" | "year";

const MONTH_PRICE = 99; // базовая цена месяца, для расчёта экономии

const plans: Record<PlanKey, { label: string; months: number; price: number }> = {
  week: { label: "Неделя", months: 1 / 4.345, price: 29 },
  month: { label: "Месяц", months: 1, price: MONTH_PRICE },
  half: { label: "Полгода", months: 6, price: 499 },
  year: { label: "Год", months: 12, price: 899 },
};

const order: PlanKey[] = ["week", "month", "half", "year"];

export default function Page() {
  const [selected, setSelected] = useState<PlanKey>("month");

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

  const onSubmit = () => {
    console.log("selected plan:", selected);
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
              Выберите период подписки. Цены фиксированы, без лишних надписей про дни.
              Для «Полгода» и «Год» сразу показываем выгоду относительно помесячной оплаты.
            </p>
          </div>

        <div className="px-3 pb-3">
          <ul className="space-y-3">
            {order.map((key) => {
              const p = plans[key];
              const save = savings(key);
              const active = selected === key;
              return (
                <li key={key}>
                  <button
                    onClick={() => setSelected(key)}
                    className={[
                      "group w-full flex items-center justify-between rounded-2xl px-4 py-4 transition shadow-sm",
                      active
                        ? "bg-white text-[#0B0F14]"
                        : "bg-black/20 text-white ring-1 ring-white/15 hover:ring-white/25 hover:bg-black/25",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={[
                          "h-9 w-9 rounded-xl flex items-center justify-center ring-1",
                          active
                            ? "bg-[#0B4DFF]/10 ring-[#0B4DFF]/20 text-[#0B4DFF]"
                            : "bg-white/10 ring-white/20 text-white/90",
                        ].join(" ")}
                      >
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
                      <span className={active ? "text-[#0B0F14]" : "text-white"}>{p.price}</span>
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

          <div className="pt-4 px-1">
            <button onClick={onSubmit} className="w-full rounded-2xl bg-[#FFB000] text-black font-medium py-3 shadow hover:opacity-95 transition">
              Продолжить
            </button>
            <p className="text-center text-[11px] text-white/70 mt-3">Подтверждая, вы соглашаетесь с условиями подписки.</p>
          </div>
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
