"use client";
import { useEffect, useState } from "react";
import TopBar from "./components/TopBar";
import BigButton from "./components/BigButton";
import { isPro } from "./lib/subscription";

import { applyTelegramThemeVars, getTg } from "./lib/tma";

export default function Home() {
  const [pro, setPro] = useState(false);

  useEffect(() => {
    try {
      const w: any = window;
      w?.Telegram?.WebApp?.ready?.(); applyTelegramThemeVars();
      w?.Telegram?.WebApp?.expand?.();
    } catch {}
    setPro(isPro());
  }, []);

  return (
    <main>
      <TopBar />
      <div style={{ padding: 16, display: "grid", gap: 14, maxWidth: 560, margin: "0 auto" }}>
        <BigButton href="/cabinet" emoji="👤" label="Личный кабинет" />
        <BigButton href="/pro" emoji="⭐" label="Купить подписку" />
        <BigButton href="/library" emoji={pro ? "📚" : "📖"} label={pro ? "Библиотека" : "Читать бесплатно"} />
      </div>
    </main>
  );
}
