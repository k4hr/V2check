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
  }, [locale]);

  const suffix = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      const sp = new URLSearchParams(u.search);
      sp.set('welcomed', '1');
      const id = u.searchParams.get('id'); if (id) sp.set('id', id);
      const s = sp.toString();
      return s ? `?${s}` : '?welcomed=1';
    } catch { return '?welcomed=1'; }
  }, []);
  const href = (p: string) => `${p}${suffix}` as Route;

  const dailyDesc  = (L as any).dailyDesc  || 'Быстрые ежедневные инструменты и автоматизации.';
  const expertDesc = (L as any).expertDesc || 'Продвинутые промпты, рецепты и профессиональные сценарии.';

  return (
    <main className="home">
      <header className="hdr">
        <h1 className="title">{L.appTitle}</h1>
        <p className="sub">{L.subtitle}</p>
      </header>

      <section className="center">
        {/* верх — пульс */}
        <Link href={href('/home/pro')} className="card glass pulse" style={{ textDecoration: 'none' }}>
          <div className="card__text">
            <b className="card__title">{L.daily}</b>
            <span className="card__desc">{dailyDesc}</span>
          </div>
          <span className="card__chev">›</span>
        </Link>

        {/* центр — стеклянная капсула с переливом */}
        <Link href={href('/home/ChatGPT')} className="gpt glass-cta" aria-label="CHATGPT 5">
          <span className="gpt__shimmer">CHATGPT&nbsp;5</span>
          <span className="gpt__chev">›</span>
        </Link>

        {/* низ — пульс + золотая подсветка */}
        <Link href={href('/home/pro-plus')} className="card glass pulse gold" style={{ textDecoration: 'none' }}>
          <div className="card__text">
            <b className="card__title">{L.expert}</b>
            <span className="card__desc">{expertDesc}</span>
          </div>
          <span className="card__chev">›</span>
        </Link>
      </section>

      {/* полноширинная стеклянная панель внизу */}
      <a href={href('/cabinet')} className="dock" aria-label={L.cabinet}>
        <b>{L.cabinet}</b>
      </a>

      <style jsx>{`
        :global(a), :global(a:visited){ text-decoration:none; color:inherit; }

        .home{
          min-height:100dvh; display:grid; grid-template-rows:auto 1fr auto;
          color:var(--text,#0f172a);
          padding:16px 14px calc(env(safe-area-inset-bottom,0px) + 72px);
          max-width:980px; margin:0 auto;
        }
        .hdr{ text-align:center; margin-bottom:6px; }
        .title{ margin:6px 0 4px; }
        .sub{ opacity:.75; margin:0; }

        /* Центрируем три кнопки по центру экрана */
        .center{
          display:grid; gap:16px; justify-items:center; align-content:center;
          min-height:calc(100dvh - 240px); /* под заголовок + док-панель */
        }
        .center > *{ width:min(92vw, 640px); }

        /* Базовое стекло */
        .glassBase{
          background:rgba(255,255,255,.42);
          border:1px solid rgba(15,23,42,.16);
          box-shadow:0 14px 34px rgba(15,23,42,.12), 0 1px 0 rgba(255,255,255,.55) inset;
          backdrop-filter:saturate(160%) blur(14px);
          -webkit-backdrop-filter:saturate(160%) blur(14px);
          transform:translateZ(0);
        }

        /* Карточки */
        .card{
          position:relative; border-radius:18px; padding:16px;
        }
        .glass{ composes: glassBase; }
        .card__text{ min-width:0; }
        .card__title{ display:block; font-size:18px; margin-bottom:6px; }
        .card__desc{ display:block; opacity:.78; font-size:14px; line-height:1.25; }
        .card__chev{ font-size:22px; opacity:.45; position:absolute; right:14px; top:50%; transform:translateY(-50%); }

        /* Пульс + мягкий ореол */
        .pulse{ animation: cardPulse 2.4s ease-in-out infinite; }
        .pulse::after{
          content:''; position:absolute; inset:-2px; border-radius:inherit;
          box-shadow:0 0 0 0 color-mix(in oklab, var(--accent,#4c82ff) 16%, transparent);
          opacity:0; pointer-events:none;
          animation: halo 2.4s ease-in-out infinite;
        }
        @keyframes cardPulse{ 0%,100%{transform:translateY(0)} 50%{transform:translateY(-1px)} }
        @keyframes halo{
          0%,100%{opacity:0; box-shadow:0 0 0 0 color-mix(in oklab, var(--accent,#4c82ff) 16%, transparent)}
          50%{opacity:.9; box-shadow:0 0 0 8px color-mix(in oklab, var(--accent,#4c82ff) 10%, transparent)}
        }

        /* Золотая подсветка Expert */
        .gold{
          border-color:rgba(250,204,21,.38);
          background:
            linear-gradient(180deg, rgba(255,230,150,.22), rgba(255,255,255,.58));
          box-shadow:
            0 18px 36px rgba(255,196,56,.14),
            0 1px 0 rgba(255,245,205,.65) inset;
        }
        .gold::after{
          animation: goldHalo 2.6s ease-in-out infinite;
          box-shadow:0 0 0 0 rgba(255,215,120,.0);
        }
        @keyframes goldHalo{
          0%,100%{opacity:.2; box-shadow:0 0 0 0 rgba(255,215,120,.0)}
          50%{opacity:.9; box-shadow:0 0 0 10px rgba(255,215,120,.18)}
        }

        /* Центр — стеклянная капсула вокруг CHATGPT 5 */
        .glass-cta{
          position:relative; border-radius:22px; min-height:120px; padding:18px;
          display:grid; grid-template-columns:1fr auto; align-items:center; justify-items:center;
          ${'' /* явная стеклянность */}
          background:rgba(255,255,255,.48);
          border:1px solid rgba(15,23,42,.14);
          box-shadow:0 22px 42px rgba(15,23,42,.12), 0 1px 0 rgba(255,255,255,.55) inset;
          backdrop-filter:saturate(160%) blur(16px);
          -webkit-backdrop-filter:saturate(160%) blur(16px);
        }
        .gpt__shimmer{
          justify-self:center; font-weight:900; letter-spacing:.02em;
          font-size:clamp(50px, 10vw, 68px); line-height:1;
          background:conic-gradient(from 180deg at 50% 50%, #9aa7ff, #6aa8ff, #a28bff, #ffdb86, #9aa7ff);
          background-size:200% 200%;
          -webkit-background-clip:text; background-clip:text; color:transparent;
          text-shadow:0 0 28px rgba(141,160,255,.18);
          animation: shimmer 6s ease-in-out infinite;
        }
        .gpt__chev{ font-size:28px; opacity:.45; }
        @keyframes shimmer{ 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }

        /* Полноширинная стеклянная панель внизу */
        .dock{
          position:fixed; left:0; right:0;
          bottom:calc(env(safe-area-inset-bottom,0px));
          padding:14px max(16px, env(safe-area-inset-left,0px));
          text-align:center; font-weight:800;
          color:#0f172a; z-index:10;
          background:rgba(255,255,255,.88);
          border-top:1px solid rgba(15,23,42,.12);
          box-shadow:0 -8px 24px rgba(15,23,42,.08), 0 1px 0 rgba(255,255,255,.6) inset;
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        }

        @media (min-width:760px){
          .glass-cta{ min-height:140px; }
        }
      `}</style>
    </main>
  );
}
