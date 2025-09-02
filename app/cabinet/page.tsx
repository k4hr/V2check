'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
        if (e?.status === 'paid') loadSubscription(WebApp?.initData || '');
      };
      (WebApp as any)?.onEvent?.('invoiceClosed', onInvoiceClosed);
      return () => {(WebApp as any)?.offEvent?.('invoiceClosed', onInvoiceClosed);};
    }
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ textAlign: 'center' }}>Личный кабинет</h1>
      {user ? (
        <p style={{ textAlign: 'center' }}>Здравствуйте, <b>{user.first_name}</b></p>
      ) : (
        <p style={{ textAlign: 'center' }}>Данные пользователя недоступны.</p>
      )}

      <div style={{ marginTop: 16 }}>
        <div style={{ margin: '0 auto', maxWidth: 680, padding: 12, border: '1px solid #333', borderRadius: 12 }}>
          <h3 style={{ marginTop: 0, textAlign: 'center' }}>Статус подписки</h3>
          <p style={{ textAlign: 'center' }}>{loadingStatus ? 'Проверяем подписку…' : statusText}</p>

          <div style={{ display:'grid', gap:12, marginTop:12 }}>
            <Link href="/pro" className="list-btn" style={{ textDecoration:'none' }}>
              <span className="list-btn__left">
                <span className="list-btn__emoji">⭐</span>
                <b>Оформить/продлить подписку</b>
              </span>
              <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
            </Link>

            <Link href="/cabinet/favorites" className="list-btn" style={{ textDecoration:'none' }}>
              <span className="list-btn__left">
                <span className="list-btn__emoji">🌟</span>
                <b>Избранное</b>
              </span>
              <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
