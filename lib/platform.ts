/* path: lib/platform.ts */
'use client';

export type Platform = 'telegram' | 'vk' | 'web';

declare global {
  interface Window {
    Telegram?: { WebApp?: any };
    vkBridge?: any;
    VKWebAppInit?: any;
  }
}

let cached: Platform | null = null;

function getAllParams(): URLSearchParams {
  // Объединяем query (?a=1) и hash (#vk_app_id=...) в единый набор
  const params = new URLSearchParams();
  try {
    const url = new URL(window.location.href);
    // query
    url.searchParams.forEach((v, k) => params.append(k, v));
    // hash
    const h = (url.hash || '').replace(/^#/, '');
    if (h) {
      const hp = new URLSearchParams(h);
      hp.forEach((v, k) => params.append(k, v));
    }
  } catch {
    // no-op
  }
  return params;
}

export function detectPlatform(): Platform {
  if (cached) return cached;

  if (typeof window !== 'undefined') {
    const params = getAllParams();

    // 1) Явный переключатель
    const p = (params.get('platform') || '').toLowerCase();
    if (p === 'vk') return (cached = 'vk');
    if (p === 'tg' || p === 'telegram') return (cached = 'telegram');
    if (p === 'web') return (cached = 'web');

    // 2) Признаки VK Mini Apps в URL (query или hash)
    const hasVkExplicit =
      params.has('vk_platform') ||
      params.has('vk_app_id') ||
      // общая проверка на любые vk_* ключи
      Array.from(params.keys()).some((k) => k.toLowerCase().startsWith('vk_'));
    if (hasVkExplicit) return (cached = 'vk');

    // 3) Признаки Telegram WebApp в URL
    const hasTgExplicit =
      params.has('tgWebAppPlatform') ||
      params.has('tgWebAppData') ||
      params.has('tgWebAppVersion');
    if (hasTgExplicit) return (cached = 'telegram');

    // 4) Рантайм-признаки
    if (window.vkBridge || (window as any).VKWebAppInit) return (cached = 'vk');
    if (window.Telegram?.WebApp) return (cached = 'telegram');
  }

  // 5) Фоллбек
  return (cached = 'web');
}

// Удобные шорткаты
export const isVK = () => detectPlatform() === 'vk';
export const isTelegram = () => detectPlatform() === 'telegram';
export const isWeb = () => detectPlatform() === 'web';
