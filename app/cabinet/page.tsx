// app/cabinet/page.tsx
'use client';

import React, { useEffect, useState } from 'react';

type User = {
  telegramId: string;
  subscriptionUntil: string | null;
};

export default function CabinetPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/me');
        const data = await res.json();
        if (data.ok) {
          setUser(data.user);
        }
      } catch (err) {
        console.error('Failed to load user', err);
      }
    })();
  }, []);

  return (
    <div className="cabinet">
      <h1>Личный кабинет</h1>
      <p>Здравствуйте, {user?.telegramId ?? 'гость'}</p>
      <h2>Статус подписки</h2>
      {user?.subscriptionUntil ? (
        <p>Активна до {new Date(user.subscriptionUntil).toLocaleString()}</p>
      ) : (
        <p>Подписка неактивна</p>
      )}
    </div>
  );
}
