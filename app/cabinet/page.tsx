'use client';
import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';

export default function CabinetPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    WebApp.ready();
    const initData = WebApp.initDataUnsafe;
    if (initData?.user) {
      setUser(initData.user);
    }
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Личный кабинет</h1>
      {user ? (
        <>
          <p>Здравствуйте, <b>{user.first_name} {user.last_name ?? ''}</b></p>
          <img src={user.photo_url} alt="avatar" width={64} style={{borderRadius: '50%'}} />
        </>
      ) : (
        <p>Здравствуйте, <b>Гость</b></p>
      )}
      <div style={{ marginTop: 20 }}>
        <h3>Статус подписки</h3>
        {/* Подписка выводится здесь */}
      </div>
    </div>
  );
}
