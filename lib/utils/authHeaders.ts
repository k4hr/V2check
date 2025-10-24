/* path: lib/utils/authHeaders.ts */
export function authHeaders(extra: Record<string, string> = {}) {
  const h: Record<string, string> = { ...extra };

  // Telegram initData
  try {
    const tg = (window as any)?.Telegram?.WebApp?.initData || '';
    if (tg) h['x-telegram-init-data'] = tg; // нижний регистр
  } catch {}

  // VK launch params
  try {
    const fromVar = (window as any).__VK_PARAMS__;
    if (fromVar) {
      h['x-vk-params'] = fromVar; // нижний регистр
    } else {
      const m = document.cookie.match(/(?:^|;\s*)vk_params=([^;]+)/);
      if (m?.[1]) h['x-vk-params'] = decodeURIComponent(m[1]);
    }
  } catch {}

  return h;
}
