// app/cabinet/CabinetClient.tsx
'use client';

import React from 'react';

type TgUser = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
};

type Subscription = { plan: string; expiresAt?: string } | null;

export default function CabinetClient() {
  const [user, setUser] = React.useState<TgUser | null>(null);
  const [sub, setSub] = React.useState<Subscription>(null);
  const [loading, setLoading] = React.useState(true);
  const [openedFromTg, setOpenedFromTg] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mod: any = await import('@twa-dev/sdk');
        const WebApp: any = mod?.default ?? mod;
        WebApp?.ready?.();
        WebApp?.expand?.();

        const unsafe = WebApp?.initDataUnsafe;
        const raw = WebApp?.initData as string | undefined;
        setOpenedFromTg(!!raw);

        if (!cancelled && unsafe?.user) setUser(unsafe.user as TgUser);

        // Ask backend for subscription (also upserts user)
        if (raw) {
          try {
            const res = await fetch('/api/me', {
              method: 'POST',
              headers: { 'x-init-data': raw },
            });
            if (res.ok) {
              const data = await res.json();
              if (!cancelled) setSub(data.subscription ?? null);
            }
          } catch {}
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const fullName =
    (user?.first_name || user?.last_name)
      ? [user?.first_name, user?.last_name].filter(Boolean).join(' ')
      : (user?.username ? '@' + user.username : 'Гость');

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px 48px' }}>
      <h1 style={{ textAlign: 'center', fontSize: 28, fontWeight: 800, margin: '6px 0 12px' }}>
        Личный кабинет
      </h1>

      <p style={{ textAlign: 'center', fontSize: 18, margin: '0 0 16px' }}>
        Здравствуйте, <b>{fullName}</b>
      </p>

      <section style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
        <div
          style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          {user?.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photo_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', opacity: 0.6 }}>👤</div>
          )}
        </div>
      </section>

      <section
        style={{
          margin: '0 auto',
          maxWidth: 520,
          borderRadius: 12,
          padding: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)',
          textAlign: 'center'
        }}
      >
        <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>Статус подписки</h2>
        {loading ? (
          <div>Загрузка…</div>
        ) : sub ? (
          <div>
            У вас оформлен <b>Juristum Pro</b>
            {sub.expiresAt ? <> — действует до <b>{new Date(sub.expiresAt).toLocaleString('ru-RU')}</b></> : null}
          </div>
        ) : (
          <div>
            Подписка не активна.
            <div style={{ marginTop: 12 }}>
              <a href="/pro" style={{ display: 'inline-block', padding: '10px 14px', borderRadius: 10, background: '#2b6cb0', color: '#fff', textDecoration: 'none' }}>
                Оформить подписку
              </a>
            </div>
          </div>
        )}
      </section>

      {!openedFromTg && (
        <p style={{ marginTop: 16, fontSize: 13, opacity: 0.6, textAlign: 'center' }}>
          Похоже, приложение открыто вне Telegram. Откройте через кнопку Web App у бота, чтобы увидеть персональные данные.
        </p>
      )}
    </main>
  );
}
