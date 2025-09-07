// app/cabinet/page.tsx
import React from 'react';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';

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

function getDisplayName() {
  // Приветствие берем из куки/заголовка Telegram WebApp, чтобы не зависеть от колонок в БД
  const h = headers();
  const c = cookies();

  const hdr = h.get('x-telegram-user');
  if (hdr) {
    try {
      const u = JSON.parse(hdr);
      return u?.first_name || u?.username || null;
    } catch {}
  }
  const raw = c.get('tg_user')?.value;
  if (raw) {
    try {
      const u = JSON.parse(raw);
      return u?.first_name || u?.username || null;
    } catch {}
  }
  return null;
}

export default async function CabinetPage() {
  // важно: без кэша, чтобы статус всегда был актуальным
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/me`, {
    cache: 'no-store',
    // прокидываем initData и user (если браузер/прокси их добавляет)
    headers: {
      ...(headers().get('x-telegram-init-data')
        ? { 'x-telegram-init-data': headers().get('x-telegram-init-data') as string }
        : {}),
      ...(headers().get('x-telegram-user')
        ? { 'x-telegram-user': headers().get('x-telegram-user') as string }
        : {}),
      ...(headers().get('x-telegram-id')
        ? { 'x-telegram-id': headers().get('x-telegram-id') as string }
        : {}),
    },
  });
  const data: MeResponse = await res.json();

  const displayName = getDisplayName();
  const until =
    data.ok && data.user.subscriptionUntil
      ? formatUntil(data.user.subscriptionUntil)
      : null;

  // Ниже — разметка в духе твоей страницы: большой заголовок, приветствие, блок «Статус подписки»,
  // две кнопки: «Оформить/продлить подписку» и «Избранное».
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
