'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useMemo } from 'react';

function haptic(type: 'light' | 'medium' = 'light') {
  try { (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type); } catch {}
}

// !!! ВАЖНО: SameSite=None; Secure — чтобы кука писалась и читалась внутри iframe VK
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
      const id = u.searchParams.get('id');
      return id ? `?id=${encodeURIComponent(id)}` : '';
    } catch { return ''; }
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
          className="lp-cta"
          aria-label="Начать"
          onClick={() => {
            setCookie('welcomed', '1'); // теперь будет работать в iframe VK
            haptic('medium');
          }}
        >
          НАЧАТЬ
          <span className="lp-cta-glow" aria-hidden />
        </Link>
      </div>

      <style jsx>{`
        .lp{position:relative;min-height:100dvh;padding:24px 16px calc(env(safe-area-inset-bottom,0px)+24px);display:grid;place-items:center;color:var(--text);background:transparent;overflow:hidden}
        .lp-inner{width:100%;max-width:860px;text-align:center}
        .lp-title{margin:0 0 26px;line-height:1.06;font-size:clamp(42px,9vw,90px);font-weight:900;letter-spacing:-0.02em;text-wrap:balance}
        .lp-gpt{background:conic-gradient(from 180deg at 50% 50%,#9aa7ff,#6aa8ff,#a28bff,#ffdb86,#9aa7ff);background-size:200% 200%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:shimmer 6s ease-in-out infinite;text-shadow:0 0 28px rgba(141,160,255,.28);white-space:nowrap}
        @keyframes shimmer{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        .lp-cta{position:relative;display:inline-grid;place-items:center;padding:16px 30px;border-radius:18px;font-weight:900;letter-spacing:.06em;text-decoration:none;color:#fff;background:radial-gradient(120% 200% at 0% 0%,rgba(99,102,241,.35),transparent 52%),linear-gradient(135deg,#5a69ff,#3a7bff 48%,#7a5cff);border:1px solid rgba(110,134,255,.85);box-shadow:0 12px 38px rgba(63,99,241,.38),0 0 0 1px rgba(255,255,255,.07) inset;transform:translateZ(0);transition:transform .08s ease,box-shadow .2s ease,filter .2s ease;isolation:isolate}
        .lp-cta:hover{transform:translateY(-1px);box-shadow:0 16px 50px rgba(63,99,241,.48),0 0 0 1px rgba(255,255,255,.09) inset;filter:brightness(1.06)}
        .lp-cta:active{transform:translateY(0)}
        .lp-cta-glow{position:absolute;inset:-25%;border-radius:24px;background:radial-gradient(60% 60% at 50% 50%,rgba(120,150,255,.35),rgba(120,150,255,.12) 40%,transparent 70%);filter:blur(18px);z-index:-1;animation:pulse 2.6s ease-in-out infinite;pointer-events:none}
        @keyframes pulse{0%,100%{opacity:.55;transform:scale(1)}50%{opacity:.85;transform:scale(1.03)}}
        .lp-orb{position:absolute;width:60vmin;height:60vmin;border-radius:50%;filter:blur(48px);opacity:.18;pointer-events:none;background:radial-gradient(closest-side,#7380ff,transparent 70%)}
        .orb-tr{top:-18vmin;right:-18vmin}.orb-bl{bottom:-22vmin;left:-22vmin}
      `}</style>
    </main>
  );
}
