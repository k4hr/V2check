
export type TgWebApp = {
  initDataUnsafe?: any;
  colorScheme?: "light" | "dark";
  themeParams?: Record<string, string>;
  isExpanded?: boolean;
  viewportHeight?: number;
  expand?: () => void;
  ready?: () => void;
  close?: () => void;
  HapticFeedback?: { impactOccurred: (s: "light" | "medium" | "heavy") => void };
  BackButton?: { show: () => void; hide: () => void; onClick: (cb: () => void) => void };
};

export function getTg() {
  if (typeof window === "undefined") return null;
  return (window as any).Telegram?.WebApp as TgWebApp | null;
}

export function applyTelegramThemeVars() {
  const tg = getTg();
  if (!tg?.themeParams) return;
  const tp = tg.themeParams;
  const root = document.documentElement;
  const map: Record<string,string> = {
    "--tg-bg": tp.bg_color ?? "",
    "--tg-text": tp.text_color ?? "",
    "--tg-hint": tp.hint_color ?? "",
    "--tg-link": tp.link_color ?? "",
    "--tg-button": tp.button_color ?? "",
    "--tg-button-text": tp.button_text_color ?? "",
    "--tg-secondary-bg": tp.secondary_bg_color ?? "",
  };
  Object.entries(map).forEach(([k, v]) => { if (v) root.style.setProperty(k, v); });
}
