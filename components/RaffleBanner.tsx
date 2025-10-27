/* path: components/RaffleBanner.tsx */
'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useMemo, useState } from 'react';

type Props = {
  startAt: string; // ISO
  endAt: string;   // ISO
};

export default function RaffleBanner({ startAt, endAt }: Props) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    try { setHidden(localStorage.getItem('raffle_banner_hidden') === '1'); } catch {}
  }, []);
  const hide = () => { try { localStorage.setItem('raffle_banner_hidden', '1'); } catch {}; setHidden(true); };

  const inRange = useMemo(() => {
    const now = Date.now();
    return now >= Date.parse(startAt) && now <= Date.parse(endAt);
  }, [startAt, endAt]);

  const suffix = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      const sp = new URLSearchParams(u.search);
      sp.set('welcomed','1');
      const id = u.searchParams.get('id');
      if (id) sp.set('id', id);
      const s = sp.toString();
      return s ? `?${s}` : '?welcomed=1';
    } catch { return '?welcomed=1'; }
  }, []);

  if (!inRange || hidden) return null;

  const from = new Date(startAt).toLocaleDateString();
  const to   = new Date(endAt).toLocaleDateString();

  return (
    <aside className="rb" role="region" aria-label="Розыгрыш подписок">
      <button className="rb__close" aria-label="Скрыть баннер" onClick={hide}>×</button>

      {/* декоративные искры */}
      <div className="rb__spark rb__spark--1" aria-hidden />
      <div className="rb__spark rb__spark--2" aria-hidden />
      <div className="rb__spark rb__spark--3" aria-hidden />

      <div className="rb__left" aria-hidden>
        <div className="rb__medal">🎟️</div>
      </div>

      <div className="rb__mid">
        <div className="rb__eyebrow">Розыгрыш</div>
        <h3 className="rb__title">Подписки LiveManager</h3>

        <div className="rb__prizes">
          <span className="pill pill--gold">1× Год</span>
          <span className="pill">2× Полгода</span>
          <span className="pill">10× Месяц</span>
        </div>

        <p className="rb__hint">
          Условие: совершите <u>любую покупку</u> в приложении.
        </p>

        <div className="rb__dates">Акция: {from} — {to}</div>
      </div>

      <div className="rb__cta">
        <Link href={`/pro${suffix}` as Route} className="btn btn--primary">Купить/продлить</Link>
        <Link href={`/raffle${suffix}` as Route} className="btn btn--ghost">Правила</Link>
      </div>

      <style jsx>{`
        .rb {
          position: relative;
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 14px;
          align-items: center;
          padding: 16px;
          margin: 14px 0;
          border-radius: 18px;
          background:
            radial-gradient(120% 180% at -10% -20%, rgba(255,210,120,.22), transparent 60%),
            radial-gradient(120% 180% at 110% 120%, rgba(120,150,255,.18), transparent 60%),
            #111624;
          border: 1px solid rgba(255,255,255,.08);
          box-shadow:
            0 14px 36px rgba(0,0,0,.35),
            0 0 0 1px rgba(255,255,255,.04) inset;
          isolation: isolate;
        }

        /* анимированная «золотая» обводка */
        .rb::before {
          content: "";
          position: absolute; inset: 0;
          border-radius: 18px;
          padding: 1px;
          background: conic-gradient(from 180deg,
            rgba(255,210,120,.55),
            rgba(120,150,255,.45),
            rgba(255,210,120,.55));
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
                  mask-composite: exclude;
          animation: spin 6s linear infinite;
          opacity: .35;
          pointer-events: none;
        }
        @keyframes spin { to { transform: rotate(1turn); } }

        .rb__close {
          position: absolute; top: 8px; right: 10px;
          width: 28px; height: 28px; border-radius: 999px;
          border: 0; background: rgba(255,255,255,.10);
          color: #fff; font-size: 18px; line-height: 28px;
          transition: filter .15s ease, transform .08s ease;
        }
        .rb__close:active { transform: translateY(1px); }

        .rb__left { display: grid; place-items: center; padding-left: 6px; }
        .rb__medal {
          width: 48px; height: 48px;
          display: grid; place-items: center; font-size: 26px;
          border-radius: 14px;
          background: linear-gradient(135deg,#2f2411,#4b3513);
          box-shadow: 0 6px 16px rgba(255,191,73,.22), 0 0 0 1px rgba(255,210,120,.25) inset;
        }

        .rb__mid { min-width: 0; }
        .rb__eyebrow {
          font-size: 12px; letter-spacing: .12em; text-transform: uppercase;
          opacity: .75;
        }
        .rb__title {
          margin: 2px 0 6px;
          font-size: 18px; line-height: 1.15; font-weight: 800;
          text-wrap: balance;
        }
        .rb__prizes { display: flex; flex-wrap: wrap; gap: 8px; }
        .pill {
          padding: 6px 10px; border-radius: 999px;
          background: rgba(120,150,255,.12); border: 1px solid rgba(120,150,255,.35);
          font-weight: 700; font-size: 13px;
        }
        .pill--gold {
          background: rgba(255,210,120,.16); border-color: rgba(255,210,120,.55);
          box-shadow: 0 0 0 1px rgba(255,210,120,.20) inset;
        }
        .rb__hint { margin: 6px 0 4px; opacity: .9; }
        .rb__dates { opacity: .65; font-size: 12px; }

        .rb__cta { display: grid; gap: 8px; align-content: center; }
        .btn {
          display: inline-grid; place-items: center; text-decoration: none; color: #fff;
          padding: 10px 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,.12);
          background: #1a2132; font-weight: 700;
          transition: transform .08s ease, filter .15s ease;
        }
        .btn:active { transform: translateY(1px); }
        .btn--primary {
          background: linear-gradient(135deg,#5a69ff,#3a7bff 48%,#7a5cff);
          border-color: rgba(110,134,255,.85);
          box-shadow: 0 10px 30px rgba(63,99,241,.25);
        }
        .btn--ghost { background: rgba(255,255,255,.06); }

        /* маленькие искры */
        .rb__spark {
          position: absolute; width: 8px; height: 8px; border-radius: 999px;
          background: radial-gradient(circle, #ffd278, transparent 70%);
          filter: blur(0.5px); opacity: .9; animation: float 5s ease-in-out infinite;
          pointer-events: none;
        }
        .rb__spark--1 { top: 6px; left: 10%; animation-delay: 0s; }
        .rb__spark--2 { bottom: 8px; right: 12%; animation-delay: 1.2s; }
        .rb__spark--3 { top: 50%; right: -6px; animation-delay: 2s; }
        @keyframes float {
          0%,100% { transform: translateY(0) scale(1); opacity: .8; }
          50%     { transform: translateY(-6px) scale(1.1); opacity: 1; }
        }

        @media (max-width: 520px) {
          .rb { grid-template-columns: 1fr auto; }
          .rb__left { display: none; }
          .rb__cta { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </aside>
  );
}
