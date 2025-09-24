'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { resolveLocaleByCountry } from '@/lib/locale';
import { useI18n } from '@/components/I18nProvider';
import { COUNTRIES, type Country } from '@/lib/countries';

export default function CountryPage() {
  const { t } = useI18n();
  const router = useRouter();
  const qp = useSearchParams();

  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const w: any = window;
    w?.Telegram?.WebApp?.ready?.();
    w?.Telegram?.WebApp?.expand?.();
  }, []);

  const debugId = useMemo(() => {
    const id = qp?.get('id');
    return id && /^\d{3,15}$/.test(id) ? id : null;
  }, [qp]);

  const goNext = () => {
    if (!selected) return;
    const locale = resolveLocaleByCountry(selected);
    const oneYear = 60 * 60 * 24 * 365;
    document.cookie = `country=${selected}; path=/; max-age=${oneYear}`;
    document.cookie = `locale=${locale}; path=/; max-age=${oneYear}`;
    try {
      localStorage.setItem('country', selected);
      localStorage.setItem('locale', locale);
    } catch {}
    const suffix = debugId ? `?id=${encodeURIComponent(debugId)}` : '';
    (router as any).push('/home' + suffix); // typedRoutes-safe bypass
  };

  return (
    <main style={{ padding: 20, maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24, marginBottom: 18 }}>
        <Image src="/logo.png" alt="logo" width={120} height={120} priority />
      </div>

      <h1 style={{ textAlign: 'center', marginBottom: 12 }}>{t('country.title')}</h1>

      <div style={{ display: 'grid', gap: 10 }}>
        {COUNTRIES.map((c: Country) => (
          <button
            key={c.code}
            onClick={() => setSelected(c.code)}
            className="list-btn"
            style={{
              textAlign: 'left',
              border: selected === c.code ? '1px solid #5b8cff' : '1px solid var(--border, #333)',
            }}
          >
            <span className="list-btn__left">
              <span className="list-btn__emoji">{c.flag}</span>
              <b>{c.name}</b>
            </span>
            <span className="list-btn__right">{selected === c.code ? '✓' : '›'}</span>
          </button>
        ))}
      </div>

      <div style={{ height: 12 }} />
      <button
        onClick={goNext}
        disabled={!selected}
        className="list-btn"
        style={{ opacity: selected ? 1 : 0.5 }}
      >
        {t('continue')}
      </button>
    </main>
  );
}
