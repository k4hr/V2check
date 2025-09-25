'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LANGUAGES, type Lang } from '@/lib/languages';
import { useI18n } from '@/components/I18nProvider';

export default function LangPage() {
  const { t } = useI18n();
  const router = useRouter();
  const qp = useSearchParams();
  const [selected, setSelected] = useState<string>('ru');

  useEffect(() => {
    const w: any = window;
    w?.Telegram?.WebApp?.ready?.();
    w?.Telegram?.WebApp?.expand?.();

    // проставляем дефолт: cookie → tg.language_code → navigator
    try {
      const fromCookie = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/)?.[1];
      if (fromCookie && LANGUAGES.some(l => l.code === fromCookie)) {
        setSelected(decodeURIComponent(fromCookie));
        return;
      }
      const tgLc: string | undefined = w?.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
      const guess = (tgLc || navigator.language || 'ru').slice(0, 2).toLowerCase();
      if (LANGUAGES.some(l => l.code === guess)) setSelected(guess);
    } catch {}
  }, []);

  const debugId = useMemo(() => {
    const id = qp?.get('id');
    return id && /^\d{3,15}$/.test(id) ? id : null;
  }, [qp]);

  const goNext = () => {
    const year = 60 * 60 * 24 * 365;
    document.cookie = `locale=${selected}; path=/; max-age=${year}`;
    try { localStorage.setItem('locale', selected); } catch {}
    const suffix = debugId ? `?id=${encodeURIComponent(debugId)}` : '';
    (router as any).push('/country' + suffix); // шаг 2
  };

  return (
    <main style={{ padding: 20, maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', margin: '6px 0 8px', fontSize: 22, fontWeight: 700 }}>
        Juristum
      </h1>
      <p style={{ textAlign:'center', margin:'0 0 12px', opacity:.7, fontSize:14 }}>
        {t('language.title') ?? 'Выберите язык'}
      </p>

      <div style={{ display:'grid', gap:10 }}>
        {LANGUAGES.map((l: Lang) => (
          <button
            key={l.code}
            onClick={() => setSelected(l.code)}
            className="list-btn"
            style={{
              textAlign:'left',
              border: selected === l.code ? '1px solid #5b8cff' : '1px solid var(--border,#333)',
            }}
          >
            <span className="list-btn__left">
              <span className="list-btn__emoji">{l.flag}</span>
              <b>{l.native}</b>
              <span style={{ opacity:.6, marginLeft:6 }}>{l.code !== 'en' ? l.name : ''}</span>
            </span>
            <span className="list-btn__right">{selected === l.code ? '✓' : '›'}</span>
          </button>
        ))}
      </div>

      <div style={{ height: 12 }} />
      <button onClick={goNext} className="list-btn">
        {t('continue')}
      </button>
    </main>
  );
}
