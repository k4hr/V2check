'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useMemo } from 'react';

export default function ProSelectPage() {
  useEffect(() => {
    const w: any = window;
    try { w?.Telegram?.WebApp?.ready?.(); w?.Telegram?.WebApp?.expand?.(); } catch {}
  }, []);

  const linkSuffix = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      const id = u.searchParams.get('id');
      return id ? `?id=${encodeURIComponent(id)}` : '';
    } catch { return ''; }
  }, []);

  return (
    <main className="lm-wrap">
      <button
        type="button"
        onClick={() => history.length > 1 ? history.back() : (location.href = '/home')}
        className="card"
        style={{ maxWidth: 120, padding: '10px 12px', marginBottom: 12 }}
      >
        ← Назад
      </button>

      <h1 style={{ textAlign: 'center' }}>Выберите подписку</h1>
      <p className="lm-subtitle" style={{ textAlign: 'center' }}>
        Сравните и перейдите к оплате
      </p>

      <div className="lm-grid" style={{ marginTop: 16 }}>
        {/* Pro (фиолетовая подсветка) */}
        <Link
          href={`/pro/min${linkSuffix}` as Route}
          className="card card--pro"
          style={{ textDecoration: 'none' }}
        >
          <span className="card__left">
            <span className="card__icon card__icon--pro">📦</span>
            <span>
              <div className="card__title">LiveManager Pro</div>
              <div className="card__subtitle">Попробуй — быстрые ежедневные инструменты</div>
            </span>
          </span>
          <span className="card__chev">›</span>
        </Link>

        {/* Pro+ (золотая подсветка) */}
        <Link
          href={`/pro/max${linkSuffix}` as Route}
          className="card card--proplus"
          style={{ textDecoration: 'none' }}
        >
          <span className="card__left">
            <span className="card__icon card__icon--proplus">✨</span>
            <span>
              <div className="card__title">LiveManager Pro+</div>
              <div className="card__subtitle">Углубись — продвинутые сценарии и повышенные лимиты</div>
            </span>
          </span>
          <span className="card__chev">›</span>
        </Link>
      </div>

      {/* --- Таблица сравнения --- */}
      <section className="cmp">
        <h2 className="cmp__title">Сравнение тарифов</h2>

        <div className="cmp-grid">
          {/* Заголовок */}
          <div className="cell cell--head cell--label">Параметр</div>
          <div className="cell cell--head">Pro</div>
          <div className="cell cell--head cell--proplus">Pro+</div>

          {/* Модель */}
          <div className="cell cell--label">Модель ИИ</div>
          <div className="cell">ChatGPT 4</div>
          <div className="cell cell--proplus">ChatGPT 5</div>

          {/* Без ограничений */}
          <div className="cell cell--label">Без ограничений</div>
          <div className="cell"><span className="chip chip--no">⛔</span></div>
          <div className="cell cell--proplus"><span className="chip chip--ok">✔</span> да†</div>

          {/* Работа с файлами */}
          <div className="cell cell--label">Работа с файлами</div>
          <div className="cell"><span className="chip chip--no">⛔</span></div>
          <div className="cell cell--proplus"><span className="chip chip--ok">✔</span></div>

          {/* Продвинутые сценарии */}
          <div className="cell cell--label">Продвинутые сценарии</div>
          <div className="cell"><span className="chip chip--no">⛔</span></div>
          <div className="cell cell--proplus"><span className="chip chip--ok">✔</span></div>

          {/* Приоритет в очереди */}
          <div className="cell cell--label">Приоритет в очереди</div>
          <div className="cell"><span className="chip chip--no">⛔</span></div>
          <div className="cell cell--proplus"><span className="chip chip--ok">✔</span></div>

          {/* Сохранение ответов */}
          <div className="cell cell--label">Сохранение ответов</div>
          <div className="cell"><span className="chip chip--no">⛔</span></div>
          <div className="cell cell--proplus"><span className="chip chip--ok">✔</span></div>

          {/* Автопереключение */}
          <div className="cell cell--label">Автопереключение модели</div>
          <div className="cell">на Mini при лимите</div>
          <div className="cell cell--proplus">на Mini при пиках</div>

          {/* Лимиты */}
          <div className="cell cell--label">Флагман-запросов в день</div>
          <div className="cell">20</div>
          <div className="cell cell--proplus">60</div>

          <div className="cell cell--label">Общий лимит запросов</div>
          <div className="cell">100</div>
          <div className="cell cell--proplus">300</div>

          {/* Оплата */}
          <div className="cell cell--label">Оплата</div>
          <div className="cell">Stars, Crypto Pay</div>
          <div className="cell cell--proplus">Stars, Crypto Pay</div>

          {/* Цена */}
          <div className="cell cell--label">Цена / месяц</div>
          <div className="cell">399 ⭐</div>
          <div className="cell cell--proplus">749 ⭐</div>
        </div>

        <p className="cmp__note">† «без ограничений» — без жёстких квот, действует fair-use: при аномальной нагрузке доступ может временно переключаться на Mini.</p>
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

        /* Фиолетовая подсветка (Pro) */
        .card--pro {
          border-color: rgba(91, 140, 255, .45);
          box-shadow:
            0 10px 30px rgba(91, 140, 255, .16),
            inset 0 0 0 1px rgba(91, 140, 255, .10);
        }
        .card__icon--pro {
          background: radial-gradient(120% 120% at 20% 20%, rgba(120,150,255,.45), rgba(120,150,255,.08) 60%, rgba(255,255,255,.05));
        }

        /* Золотая подсветка (Pro+) */
        .card--proplus {
          border-color: rgba(255, 191, 73, .45);
          box-shadow:
            0 10px 30px rgba(255,191,73,.18),
            inset 0 0 0 1px rgba(255,191,73,.10);
        }
        .card__icon--proplus {
          background: radial-gradient(120% 120% at 20% 20%, rgba(255,210,120,.55), rgba(255,210,120,.10) 60%, rgba(255,255,255,.05));
        }

        /* ===== Сравнение тарифов ===== */
        .cmp { margin-top: 18px; }
        .cmp__title {
          margin: 10px 0 10px;
          text-align: center;
          font-size: 18px;
          opacity: .95;
        }
        .cmp-grid {
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 14px;
          overflow: hidden;
          background: #111624;
        }
        /* каждая строка — три соседние ячейки */
        .cell {
          padding: 12px;
          font-size: 14px;
          border-bottom: 1px solid rgba(255,255,255,.06);
        }
        .cell--label { background: rgba(255,255,255,.02); font-weight: 600; }
        .cell--head { font-weight: 800; background: rgba(255,255,255,.04); }
        .cell--proplus { background: linear-gradient(180deg, rgba(255,210,120,.10), rgba(255,210,120,.06)); }
        /* грид для таблицы */
        .cmp-grid {
          display: grid;
          grid-template-columns: minmax(160px, 1.4fr) 1fr 1fr;
        }
        /* вертикальные разделители */
        .cmp-grid .cell:nth-child(3n+1),
        .cmp-grid .cell:nth-child(3n+2) {
          border-right: 1px solid rgba(255,255,255,.06);
        }
        /* убрать низ у последних трёх ячеек */
        .cmp-grid .cell:nth-last-child(-n+3) { border-bottom: none; }

        /* Чипы */
        .chip {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 22px; height: 22px; padding: 0 6px;
          border-radius: 999px; font-size: 12px; line-height: 22px;
          border: 1px solid transparent;
        }
        .chip--ok { background: rgba(80,200,120,.15); border-color: rgba(80,200,120,.35); }
        .chip--no { background: rgba(255,90,90,.15); border-color: rgba(255,90,90,.35); }

        .cmp__note {
          opacity: .6;
          font-size: 12px;
          margin-top: 8px;
          text-align: center;
        }

        @media (max-width: 420px) {
          .cell { padding: 10px; font-size: 13px; }
          .cmp-grid { grid-template-columns: minmax(120px, 1.2fr) 1fr 1fr; }
        }
      `}</style>
    </main>
  );
}
