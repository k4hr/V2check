'use client';

import { useEffect, useState } from 'react';

type Sub = { plan: string; expiresAt: string } | null;

export default function CabinetPage() {
  const [user, setUser] = useState<any>(null);
  const [sub, setSub] = useState<Sub>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function loadMe(initData: string) {
    if (!initData) return;
    setLoading(true);
    setErr(null);
    try {
      const resp = await fetch('/api/me', {
        method: 'POST',
        headers: { 'x-init-data': initData },
      });
      const data = await resp.json();
      if (!resp.ok || !data?.ok) throw new Error(data?.error || 'Не удалось получить статус');
      setSub(data.subscription ?? null);
    } catch (e: any) {
      setErr(e?.message || 'Ошибка загрузки');
      setSub(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const w: any = typeof window !== 'undefined' ? window : null;
    const tg = w?.Telegram?.WebApp;
    tg?.ready?.();
    tg?.expand?.();

    // Текущий пользователь по данным Telegram
    const u = tg?.initDataUnsafe?.user || null;
    setUser(u);

    const initData = tg?.initData || '';
    if (initData) loadMe(initData);

    // Авто-обновление статуса, когда окно оплаты закрывается
    const onInvoiceClosed = (event: any) => {
      // event?.status: 'paid' | 'cancelled' | 'failed' | undefined
      if (event?.status === 'paid') {
        loadMe(tg?.initData || '');
      }
    };
    tg?.onEvent?.('invoiceClosed', onInvoiceClosed);

    return () => {
      tg?.offEvent?.('invoiceClosed', onInvoiceClosed);
    };
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Личный кабинет</h1>

      {user ? (
        <>
          <p>Здравствуйте, <b>{user.username || `${user.first_name ?? ''} ${user.last_name ?? ''}` || 'пользователь'}</b></p>

          <h3>Статус подписки</h3>

          {loading ? (
            <p>Проверяем подписку…</p>
          ) : err ? (
            <p style={{ color: '#f66' }}>{err}</p>
          ) : sub ? (
            <div style={{ border: '1px solid #444', borderRadius: 8, padding: 12 }}>
              <p>✅ Подписка активна: <b>{sub.plan}</b></p>
              <p>Действует до: <b>{new Date(sub.expiresAt).toLocaleString()}</b></p>
            </div>
          ) : (
            <div style={{ border: '1px solid #444', borderRadius: 8, padding: 12 }}>
              <p>Подписка <b>не активна</b>.</p>
              <a href="/pro" style={{ textDecoration:'none' }}>
                <button style={{ padding: '10px 20px', borderRadius: 6, background: '#3b82f6', color: '#fff' }}>
                  Оформить подписку
                </button>
              </a>
            </div>
          )}
        </>
      ) : (
        <p>Данные пользователя недоступны. Откройте через Telegram WebApp.</p>
      )}
    </div>
  );
}
