// lib/platform.ts
'use client';

export type Platform = 'telegram' | 'vk' | 'web';

declare global {
  interface Window {
    Telegram?: { WebApp?: any };
    vkBridge?: any;
    VKWebAppInit?: any;
  }
}

export function detectPlatform(): Platform {
  // 1) Явный переключатель через query (?platform=vk|tg|telegram|web)
  if (typeof window !== 'undefined') {
    try {
      const url = new URL(window.location.href);
      const p = (url.searchParams.get('platform') || '').toLowerCase();
      if (p === 'vk') return 'vk';
      if (p === 'tg' || p === 'telegram') return 'telegram';
      if (p === 'web') return 'web';

      // 2) Признаки VK Mini Apps в урле
      if (url.searchParams.has('vk_platform') || url.searchParams.has('vk_app_id')) {
        return 'vk';
      }

      // 3) Признаки Telegram WebApp в урле
      if (url.searchParams.has('tgWebAppPlatform') || url.searchParams.has('tgWebAppData')) {
        return 'telegram';
      }
    } catch {
      // молча игнорим, пойдём дальше по рантайм-признакам
    }
  }

  // 4) Рантайм-признаки
  if (typeof window !== 'undefined') {
    if (window.vkBridge || (window as any).VKWebAppInit) return 'vk';
    if (window.Telegram?.WebApp) return 'telegram';
  }

  // 5) Фоллбек
  return 'web';
}

// Удобные шорткаты
export const isVK = () => detectPlatform() === 'vk';
export const isTelegram = () => detectPlatform() === 'telegram';
export const isWeb = () => detectPlatform() === 'web';
