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

/**
 * Инициализация VK Bridge:
 * - VKWebAppInit (+ попытка Expand)
 * - VKWebAppGetConfig → сохраняем api_host в window + cookie (для сервера)
 * - VKWebAppGetLaunchParams → сохраняем vk_* + sign в window/__VK_PARAMS__ и cookie vk_params
 * - подписка на UpdateConfig (если поменяется api_host/схема)
 * - форсим тёмную тему визуально + просим VK окрасить бары
 * - важное: оборачиваем window.fetch, чтобы в ПЕРВОМ же запросе ушли X-Vk-Params / X-Tg-Init-Data
 */
export default function VKBootstrap({ children }: Props) {
  useEffect(() => {
    let subscribedHandler: ((e: any) => void) | null = null;

    const setCookie = (name: string, value: string, maxAgeSec = 86400) => {
      try {
        document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSec}; SameSite=Lax`;
      } catch {}
    };

    const getCookie = (name: string) => {
      try {
        const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
        return m?.[1] ? decodeURIComponent(m[1]) : '';
      } catch { return ''; }
    };

    const setHost = (host?: string) => {
      const h = String(host || '').trim().replace(/^https?:\/\//i, '').replace(/\/+$/g, '');
      if (!h) return;
      window.__VK_API_HOST = h;
      setCookie('vk_api_host', h, 86400);
    };

    // Собираем строку "vk_* & sign" в каноническом порядке (vk_* отсортированы, sign в конце)
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
      vkOnly.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)); // сортируем ТОЛЬКО vk_*
      const qs = vkOnly.map(([k, v]) => `${k}=${v}`).join('&');
      return sign ? (qs ? `${qs}&sign=${sign}` : `sign=${sign}`) : qs;
    };

    const persistLaunchParams = async () => {
      try {
        const lp: any = await bridge.send('VKWebAppGetLaunchParams').catch(() => ({}));
        let raw = buildVkParamsString(lp || {});
        // Fallback: если по каким-то причинам пусто, попробуем собрать из location.hash/query
        if (!raw) {
          const all = new URLSearchParams(location.search + location.hash.replace(/^#/, location.search ? '&' : '?'));
          const tmp: Record<string, string> = {};
          all.forEach((v, k) => {
            if (k === 'sign' || k.startsWith('vk_')) tmp[k] = v;
          });
          raw = buildVkParamsString(tmp);
        }
        if (raw) {
          window.__VK_PARAMS__ = raw;
          setCookie('vk_params', raw, 86400); // это кука, с которой сервер будет проверять подпись
        }
      } catch {
        // ignore
      }
    };

    const forceDark = () => {
      try {
        document.documentElement.style.colorScheme = 'dark';
        document.documentElement.setAttribute('data-force-dark', '1');
      } catch {}
      // Попросим VK окрасить системные бары (если поддерживается)
      bridge
        .send('VKWebAppSetViewSettings', {
          status_bar_style: 'dark',
          action_bar_color: '#0b1220',
          navigation_bar_color: '#0b1220',
        })
        .catch(() => {});
    };

    // ——— обёртка fetch: гарантируем заголовки X-Vk-Params / X-Tg-Init-Data в каждом запросе ———
    const patchFetchOnce = () => {
      try {
        if ((window as any).__lm_fetch_patched__) return;
        const nativeFetch = window.fetch.bind(window);

        window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
          const headers = new Headers((init && init.headers) || {});
          // TG
          const tg = (window as any)?.Telegram?.WebApp?.initData || '';
          if (tg && !headers.has('X-Tg-Init-Data')) headers.set('X-Tg-Init-Data', tg);
          // VK
          const vkParams = (window as any).__VK_PARAMS__ || getCookie('vk_params') || '';
          if (vkParams && !headers.has('X-Vk-Params')) headers.set('X-Vk-Params', vkParams);

          const nextInit: RequestInit = { ...(init || {}), headers };
          return nativeFetch(input, nextInit);
        };

        (window as any).__lm_fetch_patched__ = true;
      } catch {
        // no-op
      }
    };

    (async () => {
      try {
        await bridge.send('VKWebAppInit');
        // иногда помогает, особенно в iOS WebView
        bridge.send('VKWebAppExpand').catch(() => {});

        // Конфиг окружения
        const cfg: any = await bridge.send('VKWebAppGetConfig').catch(() => ({}));
        setHost(cfg?.api_host || 'api.vk.ru');
        forceDark();

        // Launch params для серверной аутентификации
        await persistLaunchParams();
      } catch {
        // не в VK — просто молчим
      }

      // важно: патчим fetch после попытки persistLaunchParams, но даже если кука не успела — возьмём __VK_PARAMS__
      patchFetchOnce();

      // Подписка на изменения конфигурации
      const handler = (e: any) => {
        if (e?.detail?.type === 'VKWebAppUpdateConfig') {
          const data = e.detail.data || {};
          if (data.api_host) setHost(data.api_host);
          forceDark(); // даже если VK прислал светлую схему — мы остаёмся тёмными
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
