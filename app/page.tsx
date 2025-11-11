/* path: app/page.tsx */
'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useMemo } from 'react';

function haptic(type: 'light' | 'medium' = 'light') {
  try { (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type); } catch {}
}
function setCookie(k: string, v: string) {
  try {
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `${k}=${encodeURIComponent(v)}; Path=/; Max-Age=${maxAge}; SameSite=None; Secure`;
  } catch {}
}

export default function LandingPage() {
  useEffect(() => {
    const w: any = window;
    try { w?.Telegram?.WebApp?.ready?.(); w?.Telegram?.WebApp?.expand?.(); } catch {}
  }, []);

  const linkSuffix = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      const sp = new URLSearchParams(u.search);
      sp.set('welcomed', '1');
      const id = u.searchParams.get('id');
      if (id) sp.set('id', id);
      return `?${sp.toString()}`;
    } catch { return '?welcomed=1'; }
  }, []);

  return (
    <main className="lp">
      <div className="lp-orb orb-tr" aria-hidden />
      <div className="lp-orb orb-bl" aria-hidden />

      <div className="lp-inner">
        <h1 className="lp-title">
          <span className="lp-gpt">CHATGPT&nbsp;5</span>
        </h1>

        <Link
          href={`/home${linkSuffix}` as Route}
          className="lp-cta lp-cta--glass"
          role="button"
          aria-label="Начать"
          onClick={() => { setCookie('welcomed', '1'); haptic('medium'); }}
        >
          НАЧАТЬ
          <span className="lp-cta-glow" aria-hidden />
        </Link>
      </div>

      <style jsx>{`
        .lp {
          position: relative;
          min-height: 100dvh;
          padding: 24px 16px calc(env(safe-area-inset-bottom, 0px) + 24px);
          display: grid;
          place-items: center;
          color: #0d1220;
          background: transparent;
          overflow: hidden;
        }
        .lp-inner { width: 100%; max-width: 860px; text-align: center; }

        .lp-title { margin: 0 0 26px; line-height: 1.06; font-size: clamp(42px, 9vw, 90px); font-weight: 900; letter-spacing: -0.02em; text-wrap: balance; }
        .lp-gpt {
          background: linear-gradient(120deg,#8fa3ff 0%,#b9adff 20%,#ffd98b 40%,#b6efe6 60%,#a7b6ff 80%,#8fa3ff 100%);
          background-size: 220% 220%;
          -webkit-background-clip: text; background-clip: text; color: transparent;
          animation: shimmer 9s ease-in-out infinite;
          text-shadow: 0 2px 30px rgba(160,175,255,.35);
          letter-spacing: .01em;
        }
        @keyframes shimmer { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }

        /* КНОПКА — стекло */
        .lp-cta,
        :global(a.lp-cta) {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 16px 30px;
          border-radius: 18px;
          font-weight: 900;
          letter-spacing: .06em;
          text-decoration: none !important;
          color: #0d1220 !important; /* чёрный текст */
          -webkit-tap-highlight-color: transparent;
          user-select: none;
          transition: transform .12s ease, box-shadow .2s ease, border-color .2s ease, background .2s ease;
          isolation: isolate;
          touch-action: manipulation;
        }
        .lp-cta--glass {
          background: rgba(255,255,255,.82);
          border: 1px solid rgba(13,18,32,.14);
          box-shadow:
            0 14px 34px rgba(17,23,40,.14),
            inset 0 0 0 1px rgba(255,255,255,.55);
          backdrop-filter: saturate(160%) blur(14px);
          -webkit-backdrop-filter: saturate(160%) blur(14px);
        }
        /* Блик */
        .lp-cta--glass::before {
          content: '';
          position: absolute; inset: 0;
          border-radius: inherit;
          background: linear-gradient(180deg, rgba(255,255,255,.65), rgba(255,255,255,0) 55%);
          pointer-events: none;
          mix-blend-mode: screen;
          opacity: .8;
        }
        /* Свечение */
        .lp-cta-glow {
          position: absolute; inset: -22%;
          border-radius: 28px;
          background: radial-gradient(60% 60% at 50% 50%, rgba(255,255,255,.6), rgba(255,255,255,0) 60%);
          filter: blur(18px);
          z-index: -1; pointer-events: none;
          animation: pulse 2.6s ease-in-out infinite;
        }
        @keyframes pulse { 0%,100%{opacity:.5; transform:scale(1)} 50%{opacity:.85; transform:scale(1.03)} }

        .lp-cta:hover,
        :global(a.lp-cta:hover) {
          transform: translateY(-1px);
          box-shadow: 0 18px 42px rgba(17,23,40,.18), inset 0 0 0 1px rgba(255,255,255,.6);
        }
        .lp-cta:active,
        :global(a.lp-cta:active) { transform: translateY(0); }
        .lp-cta:focus-visible,
        :global(a.lp-cta:focus-visible) {
          outline: 0;
          box-shadow: 0 0 0 3px rgba(26,115,232,.25), inset 0 0 0 1px rgba(255,255,255,.6);
        }

        /* fallback без backdrop-filter */
        @supports not ((backdrop-filter: blur(10px)) or (-webkit-backdrop-filter: blur(10px))) {
          .lp-cta--glass { background: rgba(255,255,255,.95); }
        }

        .lp-orb { position: absolute; width: 60vmin; height: 60vmin; border-radius: 50%; filter: blur(48px); opacity: .16; pointer-events: none; background: radial-gradient(closest-side, #9aa7ff, transparent 70%); }
        .orb-tr { top: -18vmin; right: -18vmin; }
        .orb-bl { bottom: -22vmin; left: -22vmin; }

        @media (max-width: 420px) {
          .lp-cta { padding: 14px 24px; border-radius: 16px; }
        }
      `}</style>
    </main>
  );
}
