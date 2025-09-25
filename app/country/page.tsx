'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { resolveLocaleByCountry } from '@/lib/locale';
import { useI18n } from '@/components/I18nProvider';
import { COUNTRIES, type Country } from '@/lib/countries';

type Group = { title: string; codes: string[] };

const GROUPS: Group[] = [
  { title: 'СНГ', codes: ['RU','BY','UA','KZ','UZ','KG','AM','AZ','GE','MD','TJ','TM'] },
  { title: 'Ближний Восток', codes: ['TR','AE','SA','QA','KW','BH','OM','JO','IL','EG'] },
  { title: 'Южная и Юго-Восточная Азия', codes: ['IN','ID','MY','PH','VN','TH','SG'] },
  { title: 'Европа', codes: ['PL','CZ','SK','HU','RO','BG','RS'] },
  { title: 'Северная Америка', codes: ['US'] },
];

const byCode: Record<string, Country> = Object.fromEntries(
  COUNTRIES.map((c) => [c.code, c]),
);

export default function CountryPage() {
  const { t } = useI18n();
  const router = useRouter();
  const qp = useSearchParams();

  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const WA: any = (window as any)?.Telegram?.WebApp;
    try { WA?.ready?.(); WA?.expand?.(); } catch {}
  }, []);

  const debugId = useMemo(() => {
    const id = qp?.get('id');
    return id && /^\d{3,15}$/.test(id) ? id : null;
  }, [qp]);

  const backTarget = useMemo(
    () => (debugId ? { pathname: '/language' as const, query: { id: debugId } } : '/language'),
    [debugId],
  );

  const onBack = useCallback(() => {
    // если есть история — вернёмся назад, иначе — на страницу выбора языка
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      (router as any).push(backTarget);
    }
  }, [router, backTarget]);

  // Поддержка встроенной Back-кнопки Telegram
  useEffect(() => {
    const WA: any = (window as any)?.Telegram?.WebApp;
    try {
      WA?.BackButton?.show?.();
      WA?.onEvent?.('backButtonClicked', onBack);
      return () => WA?.offEvent?.('backButtonClicked', onBack);
    } catch {}
  }, [onBack]);

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
    (router as any).push('/home' + suffix);
  };

  return (
    <main style={{ padding: 20, maxWidth: 720, margin: '0 auto', position: 'relative' }}>
      {/* Верхняя строка с кнопкой «Назад» */}
      <div className="toprow">
        <button className="back-btn" onClick={onBack} aria-label="Назад">
          <span className="chev">‹</span> <span>{t('back') ?? 'Назад'}</span>
        </button>
      </div>

      <h1 style={{ textAlign: 'center', margin: '6px 0 6px', fontSize: 22, fontWeight: 700 }}>
        Juristum
      </h1>
      <p style={{ textAlign: 'center', margin: '0 0 12px', opacity: 0.7, fontSize: 14 }}>
        {t('country.title')}
      </p>

      <div style={{ display: 'grid', gap: 12 }}>
        {GROUPS.map((g, i) => {
          const items = g.codes.map((c) => byCode[c]).filter(Boolean);
          if (!items.length) return null;
          return (
            <details key={g.title} className="acc" {...(i === 0 ? { open: true } : {})}>
              <summary className="acc__summary">
                <b>{g.title}</b>
                <span className="chev">›</span>
              </summary>
              <div className="acc__content">
                {items.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setSelected(c.code)}
                    className="list-btn"
                    style={{
                      textAlign: 'left',
                      border:
                        selected === c.code
                          ? '1px solid #5b8cff'
                          : '1px solid var(--border, #333)',
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
            </details>
          );
        })}
      </div>

      <div style={{ height: 12 }} />
      <button onClick={goNext} disabled={!selected} className="list-btn" style={{ opacity: selected ? 1 : 0.5 }}>
        {t('continue')}
      </button>

      <style jsx>{`
        .toprow {
          position: sticky;
          top: 8px;
          z-index: 5;
          display: flex;
          align-items: center;
          margin-bottom: 6px;
        }
        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border: 1px solid var(--border, #333);
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          user-select: none;
        }
        .back-btn .chev {
          font-size: 18px;
          line-height: 1;
          transform: translateY(-1px);
        }
        .back-btn:active {
          transform: translateY(1px);
        }
        .acc {
          border: 1px solid var(--border, #333);
          border-radius: 12px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.02);
        }
        .acc + .acc {
          margin-top: 0;
        }
        .acc__summary {
          list-style: none;
          cursor: pointer;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-weight: 700;
          user-select: none;
        }
        summary::-webkit-details-marker {
          display: none;
        }
        .acc .chev {
          transition: transform 0.18s ease;
          display: inline-block;
        }
        .acc[open] .chev {
          transform: rotate(90deg);
        }
        .acc__content {
          padding: 10px;
          display: grid;
          gap: 10px;
          border-top: 1px solid var(--border, #333);
        }
      `}</style>
    </main>
  );
}
