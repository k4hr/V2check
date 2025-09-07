// app/cabinet/page.tsx
'use client';
import React, { useEffect, useState } from 'react';

type User = {
  telegramId: string;
  subscriptionUntil: string | null;
};

export default function CabinetPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/me');
        const data = await res.json();
        if (data.ok) setUser(data.user);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="p-4 text-center">
      <h1 className="text-2xl font-bold mb-4">Личный кабинет</h1>
      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <div className="space-y-2">
          <h2 className="text-xl">Статус подписки</h2>
          <p>
            {user?.subscriptionUntil
              ? `Активна до: ${new Date(user.subscriptionUntil).toLocaleDateString()}`
              : 'Подписка неактивна'}
          </p>
        </div>
      )}
    </div>
  );
}
