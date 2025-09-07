// app/cabinet/page.tsx
import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';

type MeResponse =
  | { ok: true; user: { id: number; telegramId: string; subscriptionUntil: string | null } }
  | { ok: false; error: string };

function formatUntil(dt: string) {
  try {
    const d = new Date(dt);
    return new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return null;
  }
}

export default async function CabinetPage() {
  // читаем имя из cookie Telegram WebApp (если есть)
  const c = await cookies();
  const raw = c.get('tg_user')?.value;
  let displayName: string | null = null;
  if (raw) {
    try {
      const u = JSON.parse(raw);
      displayName = u?.first_name || u?.username || null;
    } catch {}
  }

  // тянем актуальный статус (без кеша)
  const res = await fetch('/api/me', { cache: 'no-store' });
  const data: MeResponse = await res.json();

  const until =
    data.ok && data.user.subscriptionUntil
      ? formatUntil(data.user.subscriptionUntil)
      : null;

  return (
    <div className="px-6 py-8 md:py-12 max-w-3xl mx-auto">
      <h1 className="text-4xl md:text-5xl font-serif mb-8">Личный кабинет</h1>

      {displayName && (
        <p className="text-lg md:text-xl text-neutral-300 mb-6">
          Здравствуйте, <span className="font-semibold">{displayName}</span>
        </p>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8 mb-6">
        <h2 className="text-2xl md:text-3xl font-semibold mb-4">Статус подписки</h2>

        {data.ok ? (
          until ? (
            <p className="text-lg">Подписка активна до {until}</p>
          ) : (
            <p className="text-lg">Подписка неактивна</p>
          )
        ) : (
          <p className="text-lg text-red-400">Не удалось получить статус</p>
        )}
      </section>

      <div className="space-y-4">
        <Link
          href="/pay"
          className="block w-full rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-4 text-lg transition"
        >
          ⭐️ Оформить/продлить подписку<span className="float-right">›</span>
        </Link>

        <Link
          href="/favorites"
          className="block w-full rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-4 text-lg transition"
        >
          ✴️ Избранное<span className="float-right">›</span>
        </Link>
      </div>
    </div>
  );
}
