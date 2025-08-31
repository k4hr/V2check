'use client';

import { useEffect, useMemo, useState } from 'react';
import WebApp from '@twa-dev/sdk';

type Profile = {
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  photoUrl?: string | null;
};

export default function CabinetPage() {
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const initData = useMemo(() => {
    // пробуем из SDK
    try {
      const raw = (WebApp as any)?.initData || '';
      return typeof raw === 'string' ? raw : '';
    } catch {
      return '';
    }
  }, []);

  const initUser = useMemo(() => {
    try {
      const unsafe = (WebApp as any)?.initDataUnsafe;
      return unsafe?.user;
    } catch {
      return undefined;
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        // сразу показываем данные из Telegram, чтобы не ждать сеть
        if (initUser) {
          setProfile({
            firstName: initUser.first_name,
            lastName: initUser.last_name,
            username: initUser.username,
            photoUrl: initUser.photo_url,
          });
        }
        if (!initData) {
          setError('Invalid initData');
          return;
        }
        // апсертим пользователя в БД
        await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-init-data': initData },
          body: JSON.stringify({ initData }),
        });
        // подтягиваем профиль из БД (на будущее, если понадобятся план/даты)
        await fetch('/api/me?initData=' + encodeURIComponent(initData));
      } catch (e: any) {
        setError(e?.message || 'Ошибка подключения');
      }
    })();
  }, [initData, initUser]);

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="text-3xl font-bold mb-4">Личный кабинет</h1>

      {error && (
        <div className="rounded-lg bg-neutral-800 text-red-300 p-4 mb-4">
          Ошибка: {error}
        </div>
      )}

      <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-neutral-700 overflow-hidden flex items-center justify-center">
          {profile?.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.photoUrl} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl">👤</span>
          )}
        </div>
        <div>
          <div className="text-lg font-semibold">
            {profile?.firstName || profile?.username ? (
              <>
                {profile?.firstName ?? ''} {profile?.lastName ?? ''}
                {profile?.username ? <span className="opacity-70"> @{profile.username}</span> : null}
              </>
            ) : (
              'Гость'
            )}
          </div>
          <div className="text-sm opacity-70">Статус подписки появится после первой покупки</div>
        </div>
      </div>
    </div>
  );
}
