'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

export default function CabinetPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const WebApp = (window as any).Telegram.WebApp;
      WebApp.ready?.();
      WebApp.expand?.();
      setUser(WebApp.initDataUnsafe?.user || null);
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
        <p>Подписка не активна.</p>
        <button style={{ padding: '10px 20px', borderRadius: 6, background: '#3b82f6', color: '#fff' }}>Оформить подписку</button>
      </div>
    </div>
  );
}
