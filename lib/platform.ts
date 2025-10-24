/* path: lib/platform.ts */
'use client';

export type Platform = 'vk' | 'telegram' | 'web';

declare global {
  interface Window {
    Telegram?: { WebApp?: any };
    vkBridge?: any;
    VKWebAppInit?: any;
  }
}

let cached: Platform | null = null;

/** Есть ли признаки VK-параметров в URL/куках */
function hasVkParams(): boolean {
  try {
    if (typeof document !== 'undefined' && document.cookie.includes('vk_params=')) return true;

    const url = new URL(window.location.href);
    const all = new URLSearchParams(url.search + (url.hash ? '&' + url.hash.slice(1) : ''));
    for (const k of all.keys()) {
      if (k === 'sign' || k.startsWith('vk_') || k.startsWith('VK_')) return true;
    }
  } catch {}
  return false;
}

export function detectPlatform(): Platform {
  if (cached) return cached;

  try {
    const w: any = typeof window !== 'undefined' ? window : undefined;

    // 1) Явные признаки Telegram
    if (w?.Telegram?.WebApp) return (cached = 'telegram');
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent || '';
      if (/Telegram/i.test(ua)) return (cached = 'telegram');
    }

    // 2) Явные признаки VK
    if (w?.vkBridge?.send || typeof w?.VKWebAppInit === 'function') return (cached = 'vk');
    if (hasVkParams()) return (cached = 'vk');
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent || '';
      if (/VK/i.test(ua) || /VkApp/i.test(ua) || /MiniApp/i.test(ua)) return (cached = 'vk');
    }
  } catch {
    // ignore
  }

  return (cached = 'web');
}

// Шорткаты
export const isVK = () => detectPlatform() === 'vk';
export const isTelegram = () => detectPlatform() === 'telegram';
export const isWeb = () => detectPlatform() === 'web';
