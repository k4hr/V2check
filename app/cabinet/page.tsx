'use client';

// Prevent Next from trying to prerender/SSG this page on the server.
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';

type TgUser = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
};

export default function CabinetPage() {
  const [user, setUser] = useState<TgUser | null>(null);
  const [initData, setInitData] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Load Telegram SDK only on the client
        const mod = await import('@twa-dev/sdk');
        const WebApp = mod.default ?? mod;
        WebApp.ready?.();
        WebApp.expand?.();

        const unsafe = WebApp?.initDataUnsafe;
        const raw = WebApp?.initData || '';

        if (!cancelled) {
          if (unsafe?.user?.id) setUser(unsafe.user as TgUser);
          setInitData(typeof raw === 'string' ? raw : '');
        }

        // Fire-and-forget: upsert user on server (if API подключен)
        if (raw) {
          fetch('/api/auth/verify', {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-init-data': raw as string },
            body: JSON.stringify({ initData: raw }),
          }).catch(() => {});
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Init error');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const displayName = useMemo(() => {
    if (!user) return 'Гость';
    const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
    return name || (user.username ? '@' + user.username : 'ID ' + user.id);
  }, [user]);

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="text-3xl font-bold mb-4">Личный кабинет</h1>

      {error && (
        <div className="mb-4 rounded-lg bg-neutral-900 text-red-300 p-3">
          Ошибка: {error}
        </div>
      )}

      <div className="mb-6 flex items-center gap-4 rounded-2xl bg-neutral-900/60 p-4">
        <div className="h-14 w-14 overflow-hidden rounded-full ring-1 ring-white/10 flex items-center justify-center">
          {user?.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photo_url} alt="avatar" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xl">👤</span>
          )}
        </div>
        <div>
          <div className="text-lg font-semibold">{displayName}</div>
          <div className="text-sm opacity-70">initData: {initData ? 'получено' : 'нет'}</div>
        </div>
      </div>
    </div>
  );
}
