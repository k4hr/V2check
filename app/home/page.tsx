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
      tg?.ready?.();
      tg?.expand?.();
      tg?.setHeaderColor?.('secondary_bg_color');
      tg?.setBackgroundColor?.('#ffffff');
      // Протаскиваем цвета темы TG в CSS-переменные
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
      <h1 className="hm-title">{L.appTitle}</h1>
      <p className="hm-sub">{L.subtitle}</p>

      <div className="stack">
        {/* ВЕРХ — пульсирующая стеклянная карточка */}
        <Link href={href('/home/pro')} className="card glass pulse" style={{ textDecoration: 'none' }}>
          <div className="card__text">
            <b className="card__title">{L.daily}</b>
            <span className="card__desc">{dailyDesc}</span>
          </div>
          <span className="card__chev">›</span>
        </Link>

        {/* ЦЕНТР — БОЛЬШАЯ СТЕКЛЯННАЯ КНОПКА С ПЕРЕЛИВОМ */}
        <Link href={href('/home/ChatGPT')} className="gpt glass glass-cta" aria-label="CHATGPT 5">
          <span className="gpt__shimmer">CHATGPT&nbsp;5</span>
          <span className="gpt__chev">›</span>
        </Link>

        {/* НИЗ — пульсирующая стеклянная карточка */}
        <Link href={href('/home/pro-plus')} className="card glass pulse" style={{ textDecoration: 'none' }}>
          <div className="card__text">
            <b className="card__title">{L.expert}</b>
            <span className="card__desc">{expertDesc}</span>
          </div>
          <span className="card__chev">›</span>
        </Link>
      </div>

      {/* Нижняя мини-док-кнопка */}
      <a href={href('/cabinet')} className="dock" aria-label={L.cabinet}>
        <span className="dock__icon">👤</span>
        <b>{L.cabinet}</b>
      </a>

      <style jsx>{`
        :global(a), :global(a:visited){ text-decoration:none; color:inherit; }

        .home{
          min-height:100dvh;
          padding:22px 16px calc(env(safe-area-inset-bottom,0px) + 96px);
          max-width:980px; margin:0 auto; color:var(--text,#0f172a);
        }
        .hm-title{ text-align:center; margin:6px 0 4px; }
        .hm-sub{ text-align:center; opacity:.75; margin:0 0 18px; }

        .stack{ display:flex; flex-direction:column; gap:18px; }

        /* Светлое стекло */
        .glass{
          position:relative;
          background:rgba(255,255,255,.72);
          border:1px solid rgba(15,23,42,.08);
          border-radius:18px;
          box-shadow:0 18px 36px rgba(15,23,42,.10), 0 1px 0 rgba(255,255,255,.6) inset;
          backdrop-filter:saturate(160%) blur(14px);
          -webkit-backdrop-filter:saturate(160%) blur(14px);
          transform:translateZ(0);
        }
        @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))){
          .glass, .dock{ background:rgba(255,255,255,.92); }
        }

        /* Карточки (верх/низ) */
        .card{ display:grid; grid-template-columns:1fr auto; align-items:center; padding:16px; }
        .card__text{ min-width:0; }
        .card__title{ display:block; font-size:18px; margin-bottom:6px; }
        .card__desc{ display:block; opacity:.78; font-size:14px; line-height:1.25; }
        .card__chev{ font-size:22px; opacity:.45; padding-left:10px; }

        /* Пульс с сиянием */
        .pulse{ animation: cardPulse 2.4s ease-in-out infinite; }
        .pulse::after{
          content:''; position:absolute; inset:-2px; border-radius:inherit;
          box-shadow:0 0 0 0 color-mix(in oklab, var(--accent,#4c82ff) 18%, transparent);
          opacity:0; pointer-events:none;
          animation: halo 2.4s ease-in-out infinite;
        }
        @keyframes cardPulse{ 0%,100%{transform:translateY(0)} 50%{transform:translateY(-1px)} }
        @keyframes halo{
          0%,100%{opacity:0; box-shadow:0 0 0 0 color-mix(in oklab, var(--accent,#4c82ff) 18%, transparent)}
          50%{opacity:.9; box-shadow:0 0 0 8px color-mix(in oklab, var(--accent,#4c82ff) 12%, transparent)}
        }

        /* Большая стеклянная кнопка по центру */
        .glass-cta{
          display:grid; grid-template-columns:1fr auto; align-items:center; justify-items:center;
          min-height:120px; padding:18px; border-radius:22px;
          background:rgba(255,255,255,.64);
          border:1px solid rgba(15,23,42,.06);
          box-shadow:0 20px 40px rgba(15,23,42,.10), 0 1px 0 rgba(255,255,255,.55) inset;
          cursor:pointer;
        }
        .gpt, .gpt *{ text-decoration:none !important; }
        .gpt__shimmer{
          justify-self:center; font-weight:900; letter-spacing:.02em;
          font-size:clamp(48px,10vw,64px); line-height:1;
          background:conic-gradient(from 180deg at 50% 50%, #9aa7ff, #6aa8ff, #a28bff, #ffdb86, #9aa7ff);
          background-size:200% 200%;
          -webkit-background-clip:text; background-clip:text; color:transparent;
          text-shadow:0 0 28px rgba(141,160,255,.18);
          animation:shimmer 6s ease-in-out infinite;
        }
        @keyframes shimmer{ 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        .gpt__chev{ font-size:28px; opacity:.45; }

        /* Нижняя док-кнопка */
        .dock{
          position:fixed; left:50%; bottom:calc(env(safe-area-inset-bottom,0px) + 22px);
          transform:translateX(-50%);
          display:inline-flex; align-items:center; gap:10px;
          padding:12px 18px; border-radius:16px; text-decoration:none; color:#0f172a;
          background:rgba(255,255,255,.88); border:1px solid rgba(15,23,42,.08);
          box-shadow:0 14px 28px rgba(15,23,42,.12), 0 1px 0 rgba(255,255,255,.6) inset;
          backdrop-filter: blur(12px);
        }
        .dock__icon{ font-size:18px; }

        @media (min-width:760px){ .glass-cta{ min-height:140px; } }
      `}</style>
    </main>
  );
}
