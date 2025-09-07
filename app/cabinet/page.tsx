// app/cabinet/page.tsx
import React from 'react';
import Link from 'next/link';
import { headers } from 'next/headers';

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
  // Заголовки текущего запроса
  const h = headers();

  // Базовый абсолютный URL (важно для fetch в серверном компоненте)
  const proto = h.get('x-forwarded-proto') ?? 'https';
  const host =
    h.get('x-forwarded-host') ??
    h.get('host') ??
    'localhost';
  const base = `${proto}://${host}`;

  // Имя для приветствия — пробуем cookie tg_user, затем x-telegram-user
  let displayName: string | null = null;
  const cookieHeader = h.get('cookie') ?? '';
  const m = cookieHeader.match(/(?:^|;\s*)tg_user=([^;]+)/);
  if (m) {
    try {
      const u = JSON.parse(decodeURIComponent(m[1]));
      displayName = u?.first_name || u?.username || null;
    } catch {}
  }
  if (!displayName && h.get('x-telegram-user')) {
    try {
      const u = JSON.parse(h.get('x-telegram-user') as string);
      displayName = u?.first_name || u?.username || null;
    } catch {}
  }

  // Тянем статус подписки с прокидыванием заголовков
  const res = await fetch(`${base}/api/me`, {
    cache: 'no-store',
    headers: {
      cookie: cookieHeader,
      'x-telegram-user': h.get('x-telegram-user') ?? '',
      'x-telegram-id': h.get('x-telegram-id') ?? '',
      'x-telegram-init-data': h.get('x-telegram-init-data') ?? '',
    },
  });

  let data: MeResponse;
  try {
    data = await res.json();
  } catch {
    data = { ok: false, error: 'BAD_JSON' };
  }

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
