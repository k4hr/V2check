'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { resolveLocaleByCountry } from '@/lib/locale';
import { useI18n } from '@/components/I18nProvider';

type Country = { code: string; name: string; flag: string };

const COUNTRIES: Country[] = [
  { code: 'RU', name: 'Россия', flag: '🇷🇺' },
  { code: 'BY', name: 'Беларусь', flag: '🇧🇾' },
  { code: 'KZ', name: 'Казахстан', flag: '🇰🇿' },
  { code: 'UA', name: 'Украина', flag: '🇺🇦' },
  { code: 'UZ', name: 'Узбекистан', flag: '🇺🇿' },
  { code: 'KG', name: 'Киргизия', flag: '🇰🇬' },
  { code: 'AM', name: 'Армения', flag: '🇦🇲' },
  { code: 'AZ', name: 'Азербайджан', flag: '🇦🇿' },
  { code: 'GE', name: 'Грузия', flag: '🇬🇪' },
  { code: 'MD', name: 'Молдова', flag: '🇲🇩' },
  { code: 'TJ', name: 'Таджикистан', flag: '🇹🇯' },
  { code: 'TM', name: 'Туркменистан', flag: '🇹🇲' },
  { code: 'TR', name: 'Турция', flag: '🇹🇷' },
  { code: 'AE', name: 'ОАЭ', flag: '🇦🇪' },
  { code: 'IN', name: 'Индия', flag: '🇮🇳' },
  { code: 'EU', name: 'Европейский Союз', flag: '🇪🇺' },
  { code: 'US', name: 'США', flag: '🇺🇸' },
];

export default function CountryPage() {
  const { t } = useI18n();
  const router = useRouter();
  const qp = useSearchParams();

  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const w:any = window;
    w?.Telegram?.WebApp?.ready?.();
    w?.Telegram?.WebApp?.expand?.();
  }, []);

  // поддержка передачи debug id ?id=...
  const debugId = useMemo(() => {
    const id = qp?.get('id');
    return id && /^\d{3,15}$/.test(id) ? id : null;
  }, [qp]);

  const onSelect = (code: string) => {
    setSelected(code);
  };

  const goNext = () => {
    if (!selected) return;
    const locale = resolveLocaleByCountry(selected);
    const oneYear = 60 * 60 * 24 * 365;
    document.cookie = `country=${selected}; path=/; max-age=${oneYear}`;
    document.cookie = `locale=${locale}; path=/; max-age=${oneYear}`;
    try { localStorage.setItem('country', selected); localStorage.setItem('locale', locale); } catch {}
    const suffix = debugId ? `?id=${encodeURIComponent(debugId)}` : '';
    // typedRoutes-safe
    (router as any).push('/home' + suffix);
  };

  const canContinue = useMemo(() => Boolean(selected), [selected]);

  return (
    <main style={{ padding: 20, maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24, marginBottom: 18 }}>
        <Image src="/logo.png" alt="logo" width={120} height={120} priority />
      </div>

      <h1 style={{ textAlign: 'center', marginBottom: 12 }}>{t('country.title')}</h1>

      <div style={{ display: 'grid', gap: 10 }}>
        {COUNTRIES.map((c) => (
          <button
            key={c.code}
            onClick={() => onSelect(c.code)}
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
        disabled={!canContinue}
        className="list-btn"
        style={{ opacity: canContinue ? 1 : .5 }}
      >
        {t('continue')}
      </button>
    </main>
  );
}
