"use client";
import React from "react";
import WebApp from "@twa-dev/sdk";
import plans from "@/app/subscription";

export default function ProPage() {
  const handleBuy = async (plan: keyof typeof plans) => {
    try {
      const response = await fetch("/api/createInvoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await response.json();
      if (data.ok && data.link) {
        WebApp.openInvoice(data.link);
      } else {
        alert("Ошибка создания счёта");
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка сети");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B4DFF] text-white antialiased">
      <div className="max-w-md mx-auto px-5 pt-10 pb-24 space-y-4">
        <h1 className="text-2xl font-bold mb-4">Juristum Pro</h1>
        <p className="mb-6">Выберите тариф — окно Telegram-оплаты откроется сразу.</p>

        <button
          onClick={() => handleBuy("WEEK")}
          className="w-full flex justify-between items-center bg-white/10 rounded-xl px-4 py-3 text-lg"
        >
          <span>7 дней — 29 ⭐️</span>
        </button>

        <button
          onClick={() => handleBuy("MONTH")}
          className="w-full flex justify-between items-center bg-white/10 rounded-xl px-4 py-3 text-lg"
        >
          <span>30 дней — 99 ⭐️</span>
        </button>

        <button
          onClick={() => handleBuy("HALF_YEAR")}
          className="w-full flex justify-between items-center bg-white/10 rounded-xl px-4 py-3 text-lg"
        >
          <span>Полгода — 499 ⭐️</span>
        </button>

        <button
          onClick={() => handleBuy("YEAR")}
          className="w-full flex justify-between items-center bg-white/10 rounded-xl px-4 py-3 text-lg"
        >
          <span>Год — 899 ⭐️</span>
        </button>

        <p className="text-sm mt-6 opacity-80">
          Подтверждая, вы соглашаетесь с условиями подписки.
        </p>
      </div>
    </div>
  );
}
