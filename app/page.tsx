'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const COUNTRIES = [
  { code: 'RU', name: 'Россия' },
  { code: 'KZ', name: 'Казахстан' },
  { code: 'UZ', name: 'Узбекистан' },
  { code: 'KG', name: 'Киргизия' },
  { code: 'AM', name: 'Армения' },
  { code: 'AZ', name: 'Азербайджан' },
  { code: 'GE', name: 'Грузия' },
  { code: 'TR', name: 'Турция' },
  { code: 'EU', name: 'Европейский Союз' },
  { code: 'US', name: 'США' },
] as const;

type CountryCode = typeof COUNTRIES[number]['code'];

function CountryGateInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const debugId = sp.get('id') || '';

  const [selected, setSelected] = useState<CountryCode | ''>('');

  useEffect(() => {
    const w: any = window;
    try {
      w?.Telegram?.WebApp?.ready?.();
      w?.Telegram?.WebApp?.expand?.();
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('juristum.country') as CountryCode | null;
      if (saved) setSelected(saved);
    } catch {}
  }, []);

  const onSelect = (code: CountryCode) => {
    setSelected(code);
    try {
      localStorage.setItem('juristum.country', code);
      document.cookie = `country=${code}; path=/; max-age=${60 * 60 * 24 * 365}`;
    } catch {}
  };

  const goNext = () => {
    const suffix = debugId ? `?id=${encodeURIComponent(debugId)}` : '';
    // typedRoutes не любит динамический query — приводим тип
    router.push((`/home${suffix}`) as any);
  };

  const canContinue = useMemo(() => Boolean(selected), [selected]);

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'start center',
        padding: 20,
      }}
    >
      <div style={{ width: '100%', maxWidth: 520, marginTop: 32 }}>
        <div style={{ display: 'grid', placeItems: 'center', marginBottom: 20 }}>
          <img
            src="/logo.png"
            alt="Juristum"
            width={160}
            height={160}
            style={{ borderRadius: 24, objectFit: 'contain' }}
          />
        </div>

        <h1 style={{ textAlign: 'center', margin: '4px 0 14px', fontSize: 24 }}>
          Выберите вашу страну
        </h1>

        <div className="card" style={{ padding: 12, borderRadius: 16 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            {COUNTRIES.map((c) => {
              const active = selected === c.code;
              return (
                <button
                  key={c.code}
                  onClick={() => onSelect(c.code)}
                  className="list-btn"
                  style={{
                    textAlign: 'left',
                    border:
                      active ? '1px solid rgba(255,255,255,.35)' : '1px solid var(--border, #333)',
                    background: active ? 'rgba(255,255,255,.06)' : 'transparent',
                    borderRadius: 12,
                    padding: '10px 12px',
                  }}
                >
                  <span className="list-btn__left">
                    <span className="list-btn__emoji">🌍</span>
                    <b>{c.name}</b>
                  </span>
                  <span className="list-btn__right">
                    {active ? '✓' : <span className="list-btn__chev">›</span>}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 12 }}>
            <button
              disabled={!canContinue}
              onClick={goNext}
              className="list-btn"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '10px 12px',
                borderRadius: 12,
                opacity: canContinue ? 1 : 0.6,
              }}
            >
              Продолжить
            </button>
          </div>

          <p style={{ opacity: 0.65, fontSize: 12, marginTop: 10, textAlign: 'center' }}>
            Страна влияет на язык интерфейса и применимые правовые материалы.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function CountryGatePage() {
  return (
    <Suspense fallback={<main style={{ padding: 20 }}>Загрузка…</main>}>
      <CountryGateInner />
    </Suspense>
  );
}
