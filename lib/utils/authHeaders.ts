/* path: lib/utils/authHeaders.ts */
export function authHeaders(extra: Record<string, string> = {}) {
  const h: Record<string, string> = { ...extra };

  // Telegram initData
  try {
    const tg = (window as any)?.Telegram?.WebApp?.initData || '';
    if (tg) h['X-Tg-Init-Data'] = tg;
  } catch {}

  // VK launch params
  try {
    const fromVar = (window as any).__VK_PARAMS__;
    if (fromVar) {
      h['X-Vk-Params'] = fromVar;
    } else {
      const m = document.cookie.match(/(?:^|;\s*)vk_params=([^;]+)/);
      if (m?.[1]) h['X-Vk-Params'] = decodeURIComponent(m[1]);
    }
  } catch {}

  return h;
}
