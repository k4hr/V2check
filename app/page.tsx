'use client';

import Image from 'next/image';
import { useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type Country = { code: string; name: string; locale: string };

const COUNTRIES: Country[] = [
  { code: 'RU', name: 'Россия', locale: 'ru' },
  { code: 'KZ', name: 'Қазақстан', locale: 'kk' },
  { code: 'KZ_RU', name: 'Казахстан (рус.)', locale: 'ru' },
  { code: 'UA', name: 'Україна', locale: 'uk' },
  { code: 'BY', name: 'Беларусь', locale: 'ru' },
  { code: 'UZ', name: 'Oʻzbekiston', locale: 'uz' },
  { code: 'KG', name: 'Кыргызстан', locale: 'ky' },
];

const STORAGE_KEY = 'jur_country';

export default function CountrySelectPage() {
  const router = useRouter();
  const qs = useSearchParams();

  // Telegram WebApp init
  useEffect(() => {
    const w: any = window;
    try { w?.Telegram?.WebApp?.ready?.(); w?.Telegram?.WebApp?.expand?.(); } catch {}
  }, []);

  // dev-возможность сбросить сохраненную страну: /?reset=1
  const shouldReset = useMemo(() => qs?.get('reset') === '1', [qs]);
  useEffect(() => { if (shouldReset) localStorage.removeItem(STORAGE_KEY); }, [shouldReset]);

  // Если страна уже выбрана — сразу ведём в /home
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && !shouldReset) router.replace('/home');
  }, [router, shouldReset]);

  function choose(c: Country) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
    router.replace('/home');
  }

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        {/* логотип */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          {/* Помести файл логотипа в /public/logo.png (или поменяй src ниже) */}
          <Image src="/logo.png" alt="Juristum" width={180} height={180} priority />
        </div>

        <h1 style={{
          textAlign: 'center',
          margin: '0 0 10px',
          fontSize: 28,
          lineHeight: 1.2
        }}>
          Выберите&nbsp;страну
        </h1>

        <p style={{ textAlign: 'center', opacity: .75, marginTop: 0, marginBottom: 16 }}>
          Это нужно, чтобы показывать актуальные законы и шаблоны документов.
        </p>

        <div style={{ display: 'grid', gap: 10 }}>
          {COUNTRIES.map(c => (
            <button
              key={c.code}
              onClick={() => choose(c)}
              className="list-btn"
              style={{ padding: '14px 16px', borderRadius: 12 }}
            >
              <span className="list-btn__left">
                <b>{c.name}</b>
              </span>
              <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
            </button>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 14, opacity: .65, fontSize: 12 }}>
          Можно изменить позже: «Профиль → Сменить страну».
        </div>
      </div>
    </main>
  );
}
