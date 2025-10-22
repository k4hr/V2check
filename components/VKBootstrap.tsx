'use client';

import { useEffect } from 'react';
import bridge from '@vkontakte/vk-bridge';

declare global {
  interface Window {
    __VK_API_HOST?: string;
  }
}

type Props = { children?: React.ReactNode };

/**
 * Инициализация VK Bridge:
 * - bridge.init + GetConfig → сохраняем api_host в window + cookie (для сервера)
 * - подписка на UpdateConfig (если поменяется api_host/схема)
 * - форсим тёмную тему визуально + просим VK задать тёмные бары
 */
export default function VKBootstrap({ children }: Props) {
  useEffect(() => {
    let unsub: ((e: any) => void) | null = null;

    const setHost = (host?: string) => {
      const h = (host || '').trim();
      if (!h) return;
      window.__VK_API_HOST = h;
      // кука на сутки для серверных роутов
      try {
        document.cookie = `vk_api_host=${encodeURIComponent(h)}; Path=/; Max-Age=86400; SameSite=Lax`;
      } catch {}
    };

    const forceDark = () => {
      try {
        document.documentElement.style.colorScheme = 'dark';
        // иногда помогает принудительное объявление темы
        document.documentElement.setAttribute('data-force-dark', '1');
      } catch {}
      // попросим VK окрасить системные бары потемнее (если поддерживает)
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
        // инициализация бриджа
        await bridge.send('VKWebAppInit');

        // получаем конфиг платформы/окружения
        const cfg: any = await bridge.send('VKWebAppGetConfig').catch(() => ({}));
        setHost(cfg?.api_host || 'api.vk.ru'); // дефолт — официальный хост
        forceDark();
      } catch {
        // если не в VK — просто молчим
      }

      // подписываемся на апдейты окружения (смена api_host/темы и т.д.)
      const handler = (e: any) => {
        if (e?.detail?.type === 'VKWebAppUpdateConfig') {
          const data = e.detail.data || {};
          if (data.api_host) setHost(data.api_host);
          // даже если VK прислал светлую схему — оставляем приложение тёмным
          forceDark();
        }
      };
      bridge.subscribe(handler);
      unsub = handler;
    })();

    return () => {
      if (unsub) bridge.unsubscribe(unsub);
    };
  }, []);

  return <>{children}</>;
}
