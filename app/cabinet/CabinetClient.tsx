// app/cabinet/CabinetClient.tsx
'use client';

import React from 'react';

type TWebApp = {
  ready?: () => void;
  expand?: () => void;
  initDataUnsafe?: any;
};

export default function CabinetClient() {
  const [name, setName] = React.useState<string | null>(null);
  const [initOk, setInitOk] = React.useState<boolean>(false);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const mod: any = await import('@twa-dev/sdk');
        const WebApp: TWebApp = mod?.default ?? mod;

        WebApp?.ready?.();
        WebApp?.expand?.();

        const unsafe = WebApp?.initDataUnsafe;
        if (!cancelled && unsafe?.user) {
          const username =
            unsafe.user.first_name ||
            unsafe.user.username ||
            unsafe.user.last_name ||
            'Гость';
          setName(username);
          setInitOk(true);
        }
      } catch {
        // ignore, will render as guest
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const displayName = name ?? 'Гость';

  return (
    <div style={{maxWidth: 960, margin: '0 auto', padding: '24px'}}>
      <h1 style={{textAlign: 'center', marginBottom: 16}}>Личный кабинет</h1>

      <div style={{textAlign: 'center', fontSize: 18, marginBottom: 24}}>
        Здравствуйте, <strong>{displayName}</strong>
      </div>

      <section
        style={{
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 12,
          padding: 16,
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <h2 style={{marginTop: 0, marginBottom: 8}}>Статус подписки</h2>

        {!initOk ? (
          <p style={{opacity: 0.8}}>
            initData: нет. Для персонализированного кабинета откройте приложение
            из Telegram.
          </p>
        ) : (
          <p style={{opacity: 0.9}}>Данные подписки появятся после первой покупки.</p>
        )}
      </section>
    </div>
  );
}
