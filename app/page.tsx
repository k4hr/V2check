/* path: app/page.tsx */
'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useMemo } from 'react';

function haptic(type: 'light' | 'medium' = 'light') {
  try { (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type); } catch {}
}

export default function LandingPage() {
  // Телега разворачивается на фулл
  useEffect(() => {
    const w: any = window;
    try { w?.Telegram?.WebApp?.ready?.(); w?.Telegram?.WebApp?.expand?.(); } catch {}
  }, []);

  // Сохраняем возможный ?id= (твой режим отладки/проброса)
  const linkSuffix = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      const id = u.searchParams.get('id');
      return id ? `?id=${encodeURIComponent(id)}` : '';
    } catch { return ''; }
  }, []);

  return (
    <main className="lm-page" style={{ maxWidth: 900 }}>
      {/* Анимированная «аурора» поверх глобального фона */}
      <div className="lp-aurora" aria-hidden />

      {/* Герой-блок */}
      <section className="lp-hero">
        <div className="lp-badge">LiveManager</div>
        <h1 className="lp-title">CHATGPT 5</h1>
        <p className="lp-subtitle">Продвинутый помощник на базе&nbsp;ChatGPT 5</p>

        <div className="lp-cta-wrap">
          <Link
            href={`/home${linkSuffix}` as Route}
            className="lp-cta"
            onClick={() => haptic('medium')}
            aria-label="Начать работу"
          >
            НАЧАТЬ
            <span className="lp-cta-glow" aria-hidden />
          </Link>
        </div>

        <p className="lp-hint">Работает в Telegram и ВКонтакте</p>
      </section>

      <style jsx>{`
        /* Героическая коробка */
        .lp-hero {
          position: relative;
          border: 1px solid var(--card-border);
          border-radius: 20px;
          padding: 28px 22px 22px;
          margin-top: 6vh;
          background:
            radial-gradient(120% 180% at 110% -10%, rgba(99,102,241,.18), transparent 60%),
            radial-gradient(120% 160% at -10% 10%, rgba(59,130,246,.12), transparent 55%),
            linear-gradient(180deg, #10162a 0%, #0e1426 100%);
          box-shadow: 0 18px 60px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.03);
          overflow: hidden;
        }

        .lp-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          letter-spacing: .3px;
          font-size: 13px;
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid rgba(148,163,184,.18);
          background: rgba(148,163,184,.06);
          box-shadow: 0 8px 26px rgba(0,0,0,.35);
          color: var(--subtle);
        }

        .lp-title {
          margin: 10px 0 6px;
          font-size: clamp(36px, 7vw, 64px);
          line-height: 1;
          font-weight: 900;
          letter-spacing: -0.02em;
          text-shadow: 0 6px 40px rgba(101,115,255,.25);
        }

        .lp-subtitle {
          margin: 0;
          color: var(--subtle);
          font-size: clamp(14px, 2.6vw, 18px);
        }

        .lp-cta-wrap {
          margin-top: 22px;
          display: flex;
          gap: 12px;
        }

        .lp-cta {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 14px 22px;
          border-radius: 14px;
          text-decoration: none;
          font-weight: 800;
          letter-spacing: .3px;
          color: #eef2ff;
          background: linear-gradient(135deg, #6573ff 0%, #3aa0ff 100%);
          border: 1px solid rgba(120,130,255,.55);
          box-shadow:
            0 12px 38px rgba(60,110,255,.35),
            0 0 0 1px rgba(255,255,255,.06) inset;
          transform: translateY(0);
          transition: transform .12s ease, box-shadow .2s ease, filter .2s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .lp-cta:hover { transform: translateY(-1px); }
        .lp-cta:active { transform: translateY(0); filter: brightness(.98); }

        /* Мягкое «дыхание» свечения */
        .lp-cta-glow {
          position: absolute;
          inset: -12px;
          border-radius: inherit;
          background:
            radial-gradient(60% 60% at 50% 50%, rgba(100,120,255,.35), transparent 70%);
          filter: blur(14px);
          animation: pulse 2.8s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes pulse {
          0%, 100% { opacity: .55; }
          50%      { opacity: .9; }
        }

        .lp-hint {
          margin: 14px 0 0;
          font-size: 12px;
          opacity: .45;
        }

        /* Анимация «ауроры» поверх глобального фона */
        .lp-aurora {
          position: fixed;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          background:
            radial-gradient(40% 30% at 20% 10%, rgba(115,130,255,.10), transparent 60%),
            radial-gradient(50% 40% at 80% 0%, rgba(63,188,255,.10), transparent 60%),
            radial-gradient(30% 30% at 70% 80%, rgba(168,85,247,.08), transparent 60%);
          mask-image: radial-gradient(60% 60% at 50% 40%, #000 60%, transparent 100%);
          animation: auroraShift 22s linear infinite;
        }
        @keyframes auroraShift {
          0%   { transform: translate3d(0,0,0) scale(1); }
          50%  { transform: translate3d(0,-2%,0) scale(1.02); }
          100% { transform: translate3d(0,0,0) scale(1); }
        }
      `}</style>
    </main>
  );
}
