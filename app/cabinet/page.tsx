// app/cabinet/page.tsx
'use client';

import { useEffect, useState } from 'react';

type Me = { telegramId: string; subscriptionUntil: string | null };
type MeResp = { ok: boolean; me?: Me };

export default function CabinetPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/me', { credentials: 'include' });
        const j: MeResp = await r.json();
        if (j.ok && j.me) setMe(j.me);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  let status: string;
  if (loading) status = 'Загрузка…';
  else if (!me) status = 'Не удалось получить статус';
  else if (!me.subscriptionUntil) status = 'Подписка неактивна';
  else {
    const d = new Date(me.subscriptionUntil);
    status = `Подписка активна до ${d.toLocaleString('ru-RU')}`;
  }

  return (
    <div className="mx-auto max-w-xl p-4">
      <h1 className="text-4xl font-bold text-center mb-8">Личный кабинет</h1>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 mb-4">
        <h2 className="text-2xl font-semibold mb-3">Статус подписки</h2>
        <p>{status}</p>
      </div>

      <a
        className="block rounded-xl border border-neutral-800 bg-neutral-900 p-4 mb-3"
        href="/pay"
      >
        ⭐ Оформить/продлить подписку
      </a>

      <a
        className="block rounded-xl border border-neutral-800 bg-neutral-900 p-4"
        href="/favorites"
      >
        ✨ Избранное
      </a>
    </div>
  );
}
