/* path: components/VKBootstrap.tsx */
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

    const buildVkParamsString = (obj: Record<string, any>) => {
      const pairs: [string, string][] = [];
      let sign = '';
      for (const [k, v] of Object.entries(obj || {})) {
        if (k === 'sign') sign = String(v ?? '');
        else if (k.startsWith('vk_')) pairs.push([k, String(v ?? '')]);
      }
      pairs.sort(([a], [b]) => a.localeCompare(b));
      const qs = pairs.map(([k, v]) => `${k}=${v}`).join('&');
      return sign ? (qs ? `${qs}&sign=${sign}` : `sign=${sign}`) : qs;
    };

    const persistLaunchParams = async () => {
      try {
        const lp: any = await bridge.send('VKWebAppGetLaunchParams').catch(() => ({}));
        let raw = buildVkParamsString(lp || {});
        if (!raw) {
          // fallback: пробуем собрать из search+hash
          const all = new URLSearchParams(location.search + location.hash.replace(/^#/, location.search ? '&' : '?'));
          const tmp: Record<string, string> = {};
          all.forEach((v, k) => {
            if (k === 'sign' || k.startsWith('vk_')) tmp[k] = v;
          });
          raw = buildVkParamsString(tmp);
        }

        if (raw) {
          window.__VK_PARAMS__ = raw;
          setCookie('vk_params', raw, 86400);

          // ⚡ ВАЖНО: ставим welcomed=1, чтобы middleware не редиректил
          setCookie('welcomed', '1', 60 * 60 * 24 * 365);
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
      } catch (e) {
        console.warn('VKBootstrap init failed', e);
      }

      // следим за изменением конфигурации VK Mini App
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

    return () => {
      if (subscribedHandler) bridge.unsubscribe(subscribedHandler);
    };
  }, []);

  return <>{children}</>;
}
