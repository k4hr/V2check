'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

export default function CabinetPage() {
  const [user, setUser] = useState<any>(null);
  const [statusText, setStatusText] = useState<string>('Подписка не активна.');
  const [loadingStatus, setLoadingStatus] = useState<boolean>(false);

  async function loadSubscription(initData: string) {
    if (!initData) return;
    setLoadingStatus(true);
    try {
      const resp = await fetch('/api/me', { method: 'POST', headers: { 'x-init-data': initData } });
      const data = await resp.json();
      if (resp.ok && data?.ok && data?.subscription) {
        const ex = new Date(data.subscription.expiresAt);
        setStatusText(`✅ Подписка активна до ${ex.toLocaleString()}`);
      } else {
        setStatusText('Подписка не активна.');
      }
    } catch {
      setStatusText('Не удалось получить статус');
    } finally {
      setLoadingStatus(false);
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const WebApp = (window as any).Telegram.WebApp;
      WebApp.ready?.();
      WebApp.expand?.();
      setUser(WebApp.initDataUnsafe?.user || null);

      const initData = WebApp?.initData || '';
      if (initData) loadSubscription(initData);

      const onInvoiceClosed = (e:any) => {
        if (e?.status === 'paid') {
          loadSubscription(WebApp?.initData || '');
        }
      };
      (WebApp as any)?.onEvent?.('invoiceClosed', onInvoiceClosed);

      return () => {
        (WebApp as any)?.offEvent?.('invoiceClosed', onInvoiceClosed);
      };
    }
  }, []);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Личный кабинет</h1>
      {user ? (
        <>
          <p>Здравствуйте, <b>{user.first_name}</b></p>
          {user.photo_url && <img src={user.photo_url} alt="avatar" style={{ borderRadius: '50%', width: 80, height: 80 }} />}
        </>
      ) : (
        <p>Данные пользователя недоступны. Откройте через Telegram WebApp.</p>
      )}

      <div style={{ marginTop: 20, padding: 10, border: '1px solid #444', borderRadius: 8 }}>
        <h3>Статус подписки</h3>
        <p>{loadingStatus ? 'Проверяем подписку…' : statusText}</p>
        <button style={{ padding: '10px 20px', borderRadius: 6, background: '#3b82f6', color: '#fff' }}>Оформить подписку</button>
      </div>
    </div>
  );
}
