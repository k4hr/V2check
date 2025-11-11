/* path: app/home/page.tsx */
'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useMemo } from 'react';
import { STRINGS, readLocale, ensureLocaleCookie, type Locale } from '@/lib/i18n';

export default function HomePage() {
  useEffect(() => { try { ensureLocaleCookie({ sameSite: 'none', secure: true } as any); } catch {} }, []);
  const locale = useMemo<Locale>(() => readLocale(), []);
  const L = STRINGS[locale] ?? STRINGS.ru;

  useEffect(() => {
    const tg: any = (window as any)?.Telegram?.WebApp;
    try {
      tg?.ready?.(); tg?.expand?.();
      tg?.setHeaderColor?.('secondary_bg_color');
      tg?.setBackgroundColor?.('#ffffff');
      const accent = tg?.themeParams?.button_color || '#4c82ff';
      const text   = tg?.themeParams?.text_color   || '#0f172a';
      document.documentElement.style.setProperty('--accent', accent);
      document.documentElement.style.setProperty('--text',   text);
    } catch {}
    try { document.documentElement.lang = locale; } catch {}
    try {
      const ok = CSS.supports('backdrop-filter: blur(10px)') || CSS.supports('-webkit-backdrop-filter: blur(10px)');
      document.documentElement.classList.toggle('no-frost', !ok);
    } catch {}
  }, [locale]);

  // cache-buster, чтобы webview точно забрал новые стили
  const suffix = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      const sp = new URLSearchParams(u.search);
      sp.set('welcomed', '1'); sp.set('_v', 'hm9');
      const id = u.searchParams.get('id'); if (id) sp.set('id', id);
      const s = sp.toString();
      return s ? `?${s}` : '?welcomed=1&_v=hm9';
    } catch { return '?welcomed=1&_v=hm9'; }
  }, []);
  const href = (p: string) => `${p}${suffix}` as Route;

  const dailyDesc  = (L as any).dailyDesc  || 'Быстрые ежедневные инструменты и автоматизации.';
  const expertDesc = (L as any).expertDesc || 'Продвинутые промпты, рецепты и профессиональные сценарии.';
  const appTitle   = (L as any).appTitle   || 'LiveManager';

  return (
    <main className="home">
      {/* Живой фон — используем реальные элементы вместо ::before/::after */}
      <div className="bg" aria-hidden>
        <i className="bg__conic" />
        <b className="bg__blobs" />
      </div>

      <header className="hdr">
        <h1 className="title">{appTitle}</h1>
        <p className="sub">{L.subtitle}</p>
      </header>

      <section className="stack">
        <Link href={href('/home/pro')} className="card glass pulse" style={{ textDecoration: 'none' }}>
          <div className="card__text">
            <b className="card__title">{L.daily}</b>
            <span className="card__desc">{dailyDesc}</span>
          </div>
          <span className="card__chev">›</span>
        </Link>

        <Link href={href('/home/ChatGPT')} className="gpt glass-cta" aria-label="CHATGPT 5">
          <span className="gpt__shimmer">CHATGPT&nbsp;5</span>
          <span className="gpt__chev">›</span>
        </Link>

        <Link href={href('/home/pro-plus')} className="card glass pulse gold" style={{ textDecoration: 'none' }}>
          <div className="card__text">
            <b className="card__title">{L.expert}</b>
            <span className="card__desc">{expertDesc}</span>
          </div>
          <span className="card__chev">›</span>
        </Link>
      </section>

      <a href={href('/cabinet')} className="dock" aria-label={L.cabinet}>
        <b>{L.cabinet}</b>
      </a>

      <style jsx>{`
        /* глушим глобальный фон и скролл */
        :global(html, body, #__next){ height:100%; overflow:hidden; }
        :global(*){ -webkit-tap-highlight-color: transparent; }
        :global(a), :global(a:visited){ text-decoration:none; color:inherit; }
        :global(.lm-bg){ display:none !important; }

        /* возвращаем «стекло», перекрытое globals.css */
        :global(.lm-page) .card.glass{
          background: rgba(255,255,255,.20) !important;
          border: 1px solid rgba(15,23,42,.22) !important;
          box-shadow: 0 22px 44px rgba(15,23,42,.12), inset 0 1px 0 rgba(255,255,255,.55) !important;
          -webkit-backdrop-filter: blur(18px) saturate(180%) !important;
                  backdrop-filter: blur(18px) saturate(180%) !important;
        }

        .home{
          position:relative; z-index:1;
          height:100dvh; display:grid; grid-template-rows:auto 1fr;
          color:var(--text,#0f172a);
          padding:16px 14px 0;
        }

        /* ====== ЖИВОЙ ФОН на «детях» ====== */
        .bg{ position:fixed; inset:0; z-index:0; overflow:hidden;
             background: radial-gradient(120% 100% at 50% 0%, #dff5f1, #eaf3ff 70%); }
        .bg__conic{
          position:absolute; left:50%; top:50%;
          width:220vmax; height:220vmax; transform:translate(-50%,-50%) rotate(0deg);
          background: conic-gradient(
            from 0deg,
            rgba(42,214,205,.30),
            rgba(146,220,255,.28),
            rgba(255,210,160,.26),
            rgba(42,214,205,.30)
          );
          filter: blur(60px) saturate(140%); will-change: transform;
          animation: spinBg 18s linear infinite; /* заметно вращается */
          opacity:.55;
        }
        .bg__blobs{
          position:absolute; inset:-12%;
          background:
            radial-gradient(90vmax 60vmax at 18% 22%, rgba(42,214,205,.22), transparent 60%),
            radial-gradient(90vmax 60vmax at 82% 86%, rgba(92,170,255,.20), transparent 60%);
          will-change: transform; animation: floatBg 12s ease-in-out infinite alternate;
          opacity:.85;
        }
        @keyframes spinBg { to { transform: translate(-50%,-50%) rotate(360deg); } }
        @keyframes floatBg {
          0% { transform: translate3d(0,0,0) scale(1); }
          100%{ transform: translate3d(-3%,2%,0) scale(1.02); }
        }

        .hdr{ text-align:center; margin-bottom:10px; position:relative; z-index:2; }
        .title{
          margin:6px 0 4px; font-weight:800; letter-spacing:-.02em;
          font-size:32px; line-height:1.1;
          color:var(--text,#0f172a);
          -webkit-text-fill-color: currentColor !important; /* принудительно вернуть цвет */
          background:none !important;                        /* на случай протечек клипов */
        }
        .sub{ opacity:.75; margin:0; }

        .stack{
          display:grid; gap:16px; align-content:start; justify-items:center;
          padding-bottom: calc(env(safe-area-inset-bottom,0px) + 88px);
          min-height:0;
        }
        .stack > *{ width:min(92vw, 640px); }

        .card{ position:relative; padding:16px; border-radius:18px; }
        .card__text{ min-width:0; }
        .card__title{ display:block; font-size:18px; margin-bottom:6px; }
        .card__desc{ display:block; opacity:.78; font-size:14px; line-height:1.25; }
        .card__chev{ font-size:22px; opacity:.45; position:absolute; right:14px; top:50%; transform:translateY(-50%); }

        .pulse{ animation: cardPulse 2.4s ease-in-out infinite; }
        .pulse::after{
          content:''; position:absolute; inset:-2px; border-radius:inherit; pointer-events:none;
          box-shadow:0 0 0 0 color-mix(in oklab, var(--accent,#4c82ff) 16%, transparent);
          opacity:0; animation: halo 2.4s ease-in-out infinite;
        }
        @keyframes cardPulse{ 0%,100%{transform:translateY(0)} 50%{transform:translateY(-1px)} }
        @keyframes halo{
          0%,100%{opacity:0; box-shadow:0 0 0 0 color-mix(in oklab, var(--accent,#4c82ff) 16%, transparent)}
          50%{opacity:.9; box-shadow:0 0 0 10px color-mix(in oklab, var(--accent,#4c82ff) 12%, transparent)}
        }

        .gold{
          border-color: rgba(218,165,32,.6) !important;
          box-shadow: 0 18px 36px rgba(215,170,60,.18), inset 0 1px 0 rgba(255,245,205,.75) !important;
        }

        .glass-cta{
          position:relative; border-radius:22px; min-height:120px; padding:18px;
          display:grid; grid-template-columns:1fr auto; align-items:center; justify-items:center;
          background: rgba(255,255,255,.16);
          border: 1px solid rgba(15,23,42,.32);
          box-shadow: 0 28px 54px rgba(15,23,42,.18), inset 0 1px 0 rgba(255,255,255,.55);
          -webkit-backdrop-filter: blur(18px) saturate(190%);
                  backdrop-filter: blur(18px) saturate(190%);
        }
        .glass-cta::before{
          content:''; position:absolute; inset:0; border-radius:inherit; pointer-events:none; z-index:0;
          background:
            radial-gradient(120% 140% at 10% 0%, rgba(255,255,255,.58), transparent 62%),
            linear-gradient(180deg, rgba(255,255,255,.18), transparent 45%);
        }
        .gpt__shimmer{
          position:relative; z-index:1;
          justify-self:center; font-weight:900; letter-spacing:.02em;
          font-size:clamp(50px, 10vw, 68px); line-height:1;
          background:conic-gradient(from 180deg at 50% 50%, #9aa7ff, #6aa8ff, #a28bff, #ffdb86, #9aa7ff);
          background-size:200% 200%;
          -webkit-background-clip:text; background-clip:text; color:transparent;
          -webkit-text-fill-color: transparent;
          text-shadow:0 0 28px rgba(141,160,255,.18);
          animation: shimmer 6s ease-in-out infinite;
        }
        .gpt__chev{ position:relative; z-index:1; font-size:28px; opacity:.45; }
        @keyframes shimmer{ 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }

        .dock{
          position:fixed; left:0; right:0;
          bottom:calc(env(safe-area-inset-bottom,0px));
          padding:14px max(16px, env(safe-area-inset-left,0px));
          text-align:center; font-weight:800;
          color:#0f172a; z-index:2;
          background: rgba(255,255,255,.92);
          border-top:1px solid rgba(15,23,42,.16);
          box-shadow:0 -10px 28px rgba(15,23,42,.12), inset 0 1px 0 rgba(255,255,255,.68);
          -webkit-backdrop-filter: blur(12px) saturate(160%);
                  backdrop-filter: blur(12px) saturate(160%);
        }
      `}</style>
    </main>
  );
}
