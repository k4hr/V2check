/* path: lib/utils/authHeaders.ts */
function readCookie(name: string): string {
  try {
    const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
    return m ? decodeURIComponent(m[1]) : '';
  } catch { return ''; }
}

function canonicalizeVkParams(raw: string): string {
  try {
    const sp = new URLSearchParams(raw.startsWith('?') ? raw.slice(1) : raw);
    const entries: [string, string][] = [];
    sp.forEach((v, k) => {
      if (k === 'sign') return;
      if (k.startsWith('vk_')) entries.push([k, v]);
    });
    entries.sort(([a],[b]) => a.localeCompare(b));
    const qs = new URLSearchParams(entries as any).toString();
    const sign = sp.get('sign') || '';
    return sign ? (qs ? `${qs}&sign=${sign}` : `sign=${sign}`) : qs;
  } catch { return ''; }
}

/** Пробуем получить launch-параметры VK и сохранить их (в window.__VK_PARAMS__ и куку) */
export async function ensureVkParams(): Promise<boolean> {
  try {
    // уже есть?
    const fromWin = (window as any).__VK_PARAMS__;
    if (fromWin) return true;
    const fromCookie = readCookie('vk_params');
    if (fromCookie) { (window as any).__VK_PARAMS__ = fromCookie; return true; }

    // достанем из bridge
    const mod = await import('@vkontakte/vk-bridge');
    const bridge = (mod.default || mod) as any;

    await bridge.send('VKWebAppInit').catch(() => {});
    const lp = await bridge.send('VKWebAppGetLaunchParams').catch(() => ({}));

    // если не вернул — попробуем собрать из location.search+hash
    let raw = '';
    if (lp && typeof lp === 'object') {
      const tmp = new URLSearchParams();
      Object.entries(lp).forEach(([k, v]) => {
        if (k === 'sign' || k.startsWith('vk_')) tmp.set(k, String(v ?? ''));
      });
      raw = canonicalizeVkParams(tmp.toString());
    }
    if (!raw) {
      const all = new URLSearchParams(
        location.search + location.hash.replace(/^#/, location.search ? '&' : '?')
      );
      const tmp = new URLSearchParams();
      all.forEach((v, k) => { if (k === 'sign' || k.startsWith('vk_')) tmp.set(k, v); });
      raw = canonicalizeVkParams(tmp.toString());
    }
    if (!raw) return false;

    (window as any).__VK_PARAMS__ = raw;
    // важно для iframe — None+Secure
    document.cookie = `vk_params=${encodeURIComponent(raw)}; Path=/; Max-Age=${60*60*24}; SameSite=None; Secure`;
    return true;
  } catch { return false; }
}

export function authHeaders(extra: Record<string, string> = {}) {
  const h: Record<string, string> = { ...extra };

  // Telegram initData
  try {
    const tg = (window as any)?.Telegram?.WebApp?.initData || '';
    if (tg && !h['X-Telegram-Init-Data']) h['X-Telegram-Init-Data'] = tg;
  } catch {}

  // VK launch params
  try {
    const fromVar = (window as any).__VK_PARAMS__;
    if (fromVar) {
      h['X-Vk-Params'] = fromVar;
    } else {
      const fromCookie = readCookie('vk_params');
      if (fromCookie) h['X-Vk-Params'] = fromCookie;
    }
  } catch {}

  return h;
}
