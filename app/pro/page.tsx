/* path: app/pro/page.tsx */
'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useMemo } from 'react';
import { readLocale, STRINGS, type Locale } from '@/lib/i18n';

export default function ProSelectPage() {
  const locale: Locale = readLocale();
  const S = STRINGS[locale];

  useEffect(() => {
    const w: any = window;
    try { w?.Telegram?.WebApp?.ready?.(); w?.Telegram?.WebApp?.expand?.(); } catch {}
    try { document.documentElement.lang = locale; } catch {}
  }, [locale]);

  const linkSuffix = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      const id = u.searchParams.get('id');
      return id ? `?id=${encodeURIComponent(id)}` : '';
    } catch { return ''; }
  }, []);

  // Небольшие подписи (ru/en), для остальных — русские как дефолт
  const T = {
    back: S.back || 'Назад',
    choosePlan: locale === 'en' ? 'Choose a plan' : 'Выберите подписку',
    compareAndPay: locale === 'en' ? 'Compare and proceed to payment' : 'Сравните и перейдите к оплате',
    proTitle: 'LiveManager Pro',
    proSub: locale === 'en' ? 'Try fast daily tools' : 'Попробуй — быстрые ежедневные инструменты',
    proPlusTitle: 'LiveManager Pro+',
    proPlusSub: locale === 'en' ? 'Go deeper: advanced scenarios & higher limits' : 'Углубись — продвинутые сценарии и повышенные лимиты',
  };

  return (
    <main className="lm-wrap">
      <button
        type="button"
        onClick={() => history.length > 1 ? history.back() : (location.href = '/home')}
        className="card"
        style={{ maxWidth: 120, padding: '10px 12px', marginBottom: 12 }}
      >
        ← {T.back}
      </button>

      <h1 style={{ textAlign: 'center' }}>{T.choosePlan}</h1>
      <p className="lm-subtitle" style={{ textAlign: 'center' }}>
        {T.compareAndPay}
      </p>

      <div className="lm-grid" style={{ marginTop: 16 }}>
        {/* Pro */}
        <Link
          href={`/pro/min${linkSuffix}` as Route}
          className="card card--pro"
          style={{ textDecoration: 'none' }}
        >
          <span className="card__left">
            <span className="card__icon card__icon--pro">📦</span>
            <span>
              <div className="card__title">{T.proTitle}</div>
              <div className="card__subtitle">{T.proSub}</div>
            </span>
          </span>
          <span className="card__chev">›</span>
        </Link>

        {/* Pro+ */}
        <Link
          href={`/pro/max${linkSuffix}` as Route}
          className="card card--proplus"
          style={{ textDecoration: 'none' }}
        >
          <span className="card__left">
            <span className="card__icon card__icon--proplus">✨</span>
            <span>
              <div className="card__title">{T.proPlusTitle}</div>
              <div className="card__subtitle">{T.proPlusSub}</div>
            </span>
          </span>
          <span className="card__chev">›</span>
        </Link>
      </div>

      {/* --- Таблица сравнения --- */}
      <section className="cmp">
        <h2 className="cmp__title">{S.compareTitle}</h2>

        <div className="cmp-grid">
          {/* Заголовок */}
          <div className="cell cell--head cell--label">{S.param}</div>
          <div className="cell cell--head">Pro</div>
          <div className="cell cell--head cell--proplus-head">Pro+</div>

          {/* Модель ИИ */}
          <div className="cell cell--label">{S.aiModel}</div>
          <div className="cell">ChatGPT 5 mini</div>
          <div className="cell cell--proplus">ChatGPT 5</div>

          {/* Без ограничений */}
          <div className="cell cell--label">{S.unlimited}</div>
          <div className="cell"><span className="chip chip--no">⛔</span></div>
          <div className="cell cell--proplus"><span className="chip chip--ok">✅</span></div>

          {/* Работа с файлами */}
          <div className="cell cell--label">{S.filesWork}</div>
          <div className="cell"><span className="chip chip--no">⛔</span></div>
          <div className="cell cell--proplus"><span className="chip chip--ok">✅</span></div>

          {/* Продвинутые сценарии */}
          <div className="cell cell--label">{S.advancedScenarios}</div>
          <div className="cell"><span className="chip chip--no">⛔</span></div>
          <div className="cell cell--proplus"><span className="chip chip--ok">✅</span></div>

          {/* Приоритет в очереди */}
          <div className="cell cell--label">{S.queuePriority}</div>
          <div className="cell"><span className="chip chip--no">⛔</span></div>
          <div className="cell cell--proplus"><span className="chip chip--ok">✅</span></div>

          {/* Сохранение ответов */}
          <div className="cell cell--label">{S.saveAnswers}</div>
          <div className="cell"><span className="chip chip--no">⛔</span></div>
          <div className="cell cell--proplus"><span className="chip chip--ok">✅</span></div>
        </div>
      </section>

      <style jsx>{`
        .lm-wrap { padding: 20px; max-width: 780px; margin: 0 auto; }
        .lm-subtitle { opacity: .7; margin-top: 6px; }
        .lm-grid { display: grid; gap: 12px; }

        .card {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px; border-radius: 14px;
          background: #161b25; border: 1px solid rgba(255,255,255,.08);
          color: inherit; box-shadow: 0 6px 24px rgba(0,0,0,.25);
          transition: transform .12s ease, box-shadow .12s ease, border-color .12s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .card:hover { transform: translateY(-1px); }
        .card__left { display: flex; gap: 12px; align-items: center; }
        .card__icon {
          width: 36px; height: 36px; display: grid; place-items: center; font-size: 20px;
          background: rgba(255,255,255,.06); border-radius: 10px;
        }
        .card__title { font-weight: 800; font-size: 16px; line-height: 1.1; }
        .card__subtitle { opacity: .78; font-size: 13px; margin-top: 2px; }
        .card__chev { opacity: .6; font-size: 22px; }

        /* Pro */
        .card--pro {
          border-color: rgba(91, 140, 255, .45);
          box-shadow: 0 10px 30px rgba(91, 140, 255, .16), inset 0 0 0 1px rgba(91, 140, 255, .10);
        }
        .card__icon--pro {
          background: radial-gradient(120% 120% at 20% 20%, rgba(120,150,255,.45), rgba(120,150,255,.08) 60%, rgba(255,255,255,.05));
        }

        /* Pro+ карточка (золото) */
        .card--proplus {
          border-color: rgba(255, 191, 73, .45);
          box-shadow: 0 10px 30px rgba(255,191,73,.18), inset 0 0 0 1px rgba(255,191,73,.10);
        }
        .card__icon--proplus {
          background: radial-gradient(120% 120% at 20% 20%, rgba(255,210,120,.55), rgba(255,210,120,.10) 60%, rgba(255,255,255,.05));
        }

        /* ===== Таблица ===== */
        .cmp { margin-top: 18px; }
        .cmp__title { margin: 10px 0 10px; text-align: center; font-size: 18px; opacity: .95; }

        .cmp-grid {
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 14px;
          overflow: hidden;
          background: #111624;
          display: grid;
          grid-template-columns: minmax(160px, 1.4fr) 1fr 1fr;
        }

        /* Все по центру */
        .cell {
          padding: 12px;
          font-size: 14px;
          border-bottom: 1px solid rgba(255,255,255,.06);
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          min-height: 54px;
          position: relative;
        }
        .cell--label { background: rgba(255,255,255,.02); font-weight: 600; }
        .cell--head  { font-weight: 800; background: rgba(255,255,255,.04); }

        /* Вертикальные разделители */
        .cmp-grid .cell:nth-child(3n+1),
        .cmp-grid .cell:nth-child(3n+2) { border-right: 1px solid rgba(255,255,255,.06); }
        .cmp-grid .cell:nth-last-child(-n+3) { border-bottom: none; }

        /* Pro+ колонка — золотой фон, не перекрывает контент */
        .cell--proplus,
        .cell--proplus-head {
          background: linear-gradient(135deg,#2f2411 0%, #3b2c12 45%, #4b3513 100%);
          color: #fff;
        }
        .cell--proplus-head { font-weight: 800; }

        /* Чипы всегда поверх */
        .chip {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 24px; height: 24px; padding: 0 8px;
          border-radius: 999px; font-size: 13px; line-height: 24px;
          border: 1px solid transparent;
          position: relative; z-index: 1;
        }
        .chip--ok {
          background: rgba(80,200,120,.30);
          border-color: rgba(80,200,120,.55);
          color: #dfffe6;
        }
        .chip--no {
          background: rgba(255,90,90,.22);
          border-color: rgba(255,90,90,.45);
          color: #ffd6d6;
        }

        @media (max-width: 420px) {
          .cell { padding: 10px; font-size: 13px; min-height: 48px; }
          .cmp-grid { grid-template-columns: minmax(120px, 1.2fr) 1fr 1fr; }
        }
      `}</style>
    </main>
  );
}
