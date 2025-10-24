'use client';

import { useEffect } from 'react';
import bridge from '@vkontakte/vk-bridge';

declare global {
  interface Window {
    __VK_API_HOST?: string;
    __VK_PARAMS__?: string;
  }
}

type Props = { children?: React.ReactNode };

/**
 * Инициализация VK Bridge + сохранение vk_params в куку
 * ВАЖНО: куки — SameSite=None; Secure (так как работаем в iframe VK: третья сторона).
 */
export default function VKBootstrap({ children }: Props) {
  useEffect(() => {
    let subscribedHandler: ((e: any) => void) | null = null;

    const setCookie = (name: string, value: string, maxAgeSec = 86400) => {
      try {
        document.cookie =
          `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSec}; SameSite=None; Secure`;
      } catch {}
    };

    const setHost = (host?: string) => {
      const h = String(host || '').trim().replace(/^https?:\/\//i, '').replace(/\/+$/g, '');
      if (!h) return;
      window.__VK_API_HOST = h;
      setCookie('vk_api_host', h, 86400);
    };

    // Собираем строку "vk_* & sign" в каноническом порядке
    const buildVkParamsString = (obj: Record<string, any>) => {
      const entries = Object.entries(obj || {}).filter(
        ([k]) => k === 'sign' || k.startsWith('vk_')
      ) as [string, any][];

      let sign = '';
      const vkOnly: [string, string][] = [];
      for (const [k, v] of entries) {
        if (k === 'sign') sign = String(v ?? '');
        else vkOnly.push([k, String(v ?? '')]);
      }
      vkOnly.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
      const qs = vkOnly.map(([k, v]) => `${k}=${v}`).join('&');
      return sign ? (qs ? `${qs}&sign=${sign}` : `sign=${sign}`) : qs;
    };

    const persistLaunchParams = async () => {
      try {
        const lp: any = await bridge.send('VKWebAppGetLaunchParams').catch(() => ({}));
        let raw = buildVkParamsString(lp || {});
        if (!raw) {
          const all = new URLSearchParams(location.search + location.hash.replace(/^#/, location.search ? '&' : '?'));
          const tmp: Record<string, string> = {};
          all.forEach((v, k) => { if (k === 'sign' || k.startsWith('vk_')) tmp[k] = v; });
          raw = buildVkParamsString(tmp);
        }
        if (raw) {
          window.__VK_PARAMS__ = raw;
          // критично: SameSite=None; Secure
          setCookie('vk_params', raw, 86400);
        }
      } catch {}
    };

    const forceDark = () => {
      try {
        document.documentElement.style.colorScheme = 'dark';
        document.documentElement.setAttribute('data-force-dark', '1');
      } catch {}
      bridge
        .send('VKWebAppSetViewSettings', {
          status_bar_style: 'dark',
          action_bar_color: '#0b1220',
          navigation_bar_color: '#0b1220',
        })
        .catch(() => {});
    };

    (async () => {
      try {
        await bridge.send('VKWebAppInit');
        bridge.send('VKWebAppExpand').catch(() => {});
        const cfg: any = await bridge.send('VKWebAppGetConfig').catch(() => ({}));
        setHost(cfg?.api_host || 'api.vk.ru');
        forceDark();
        await persistLaunchParams();
      } catch {}
      const handler = (e: any) => {
        if (e?.detail?.type === 'VKWebAppUpdateConfig') {
          const data = e.detail.data || {};
          if (data.api_host) setHost(data.api_host);
          forceDark();
        }
      };
      bridge.subscribe(handler);
      subscribedHandler = handler;
    })();

    return () => { if (subscribedHandler) bridge.unsubscribe(subscribedHandler); };
  }, []);

  return <>{children}</>;
}
