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
    try {
      const support =
        CSS.supports('backdrop-filter: blur(10px)') ||
        CSS.supports('-webkit-backdrop-filter: blur(10px)');
      document.documentElement.classList.toggle('no-frost', !support);
      document.documentElement.lang = locale;
    } catch {}
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
        {/* ВЕРХ — стекло + пульс */}
        <Link href={href('/home/pro')} className="card glass pulse" style={{ textDecoration: 'none' }}>
          <div className="card__text">
            <b className="card__title">{L.daily}</b>
            <span className="card__desc">{dailyDesc}</span>
          </div>
          <span className="card__chev">›</span>
        </Link>

        {/* ЦЕНТР — стеклянная капсула с переливом текста */}
        <Link href={href('/home/ChatGPT')} className="gpt glass-cta" aria-label="CHATGPT 5">
          <span className="gpt__shimmer">CHATGPT&nbsp;5</span>
          <span className="gpt__chev">›</span>
        </Link>

        {/* НИЗ — стекло + золотой пульс/подсветка */}
        <Link href={href('/home/pro-plus')} className="card glass pulse gold" style={{ textDecoration: 'none' }}>
          <div className="card__text">
            <b className="card__title">{L.expert}</b>
            <span className="card__desc">{expertDesc}</span>
          </div>
          <span className="card__chev">›</span>
        </Link>
      </section>

      {/* Низ — полноширинная стеклянная панель */}
      <a href={href('/cabinet')} className="dock" aria-label={L.cabinet}>
        <b>{L.cabinet}</b>
      </a>

      <style jsx>{`
        :global(a), :global(a:visited){ text-decoration:none; color:inherit; }

        .home{
          min-height:100dvh; display:grid; grid-template-rows:auto 1fr auto;
          color:var(--text,#0f172a);
          padding:16px 14px calc(env(safe-area-inset-bottom,0px) + 76px);
          max-width:980px; margin:0 auto;
          /* фон под стекло — лёгкие пятна, чтоб был контраст */
          background:
            radial-gradient(120vmax 80vmax at 15% 25%, rgba(140,180,255,.12), transparent 60%),
            radial-gradient(120vmax 80vmax at 85% 85%, rgba(140,255,200,.12), transparent 60%);
        }
        .hdr{ text-align:center; margin-bottom:8px; }
        .title{ margin:6px 0 4px; }
        .sub{ opacity:.75; margin:0; }

        .center{
          display:grid; gap:16px; justify-items:center; align-content:center;
          min-height:calc(100dvh - 240px);
        }
        .center > *{ width:min(92vw, 680px); }

        /* === Настоящее стекло === */
        .glass{
          position:relative; border-radius:18px; padding:16px; overflow:hidden;
          background: rgba(255,255,255,.26);              /* прозрачность */
          border: 1px solid rgba(15,23,42,.16);           /* тонкая граница */
          box-shadow:
            0 22px 44px rgba(15,23,42,.12),
            0 1px 0 rgba(255,255,255,.55) inset;
          -webkit-backdrop-filter: blur(18px) saturate(180%);
          backdrop-filter: blur(18px) saturate(180%);
        }
        /* блик/белая плёнка сверху — усиливает «стекло» */
        .glass::before{
          content:''; position:absolute; inset:0; pointer-events:none;
          background:
            linear-gradient(180deg, rgba(255,255,255,.35), rgba(255,255,255,.10) 40%, transparent 70%);
        }
        /* если нет поддержки blur — оставляем полупрозрачность, но не делаем белую подложку */
        :global(.no-frost) .glass,
        :global(.no-frost) .glass-cta,
        :global(.no-frost) .dock{
          -webkit-backdrop-filter:none; backdrop-filter:none;
          background: rgba(255,255,255,.35);
        }

        .card{ display:grid; grid-template-columns:1fr auto; align-items:center; }
        .card__text{ min-width:0; position:relative; z-index:1; }
        .card__title{ display:block; font-size:18px; margin-bottom:6px; }
        .card__desc{ display:block; opacity:.82; font-size:14px; line-height:1.25; }
        .card__chev{ font-size:22px; opacity:.50; padding-left:10px; position:relative; z-index:1; }

        /* Мягкий пульс + ореол; цвет берётся из --pulse-clr */
        .pulse{ animation: cardPulse 2.6s ease-in-out infinite; }
        .pulse::after{
          content:''; position:absolute; inset:-2px; border-radius:inherit; z-index:0;
          --pulse-clr: color-mix(in oklab, var(--accent,#4c82ff) 18%, transparent);
          box-shadow:0 0 0 0 var(--pulse-clr); opacity:0; pointer-events:none;
          animation: halo 2.6s ease-in-out infinite;
        }
        @keyframes cardPulse{ 0%,100%{transform:translateY(0)} 50%{transform:translateY(-1px)} }
        @keyframes halo{
          0%,100%{opacity:0; box-shadow:0 0 0 0 var(--pulse-clr)}
          50%{opacity:.9; box-shadow:0 0 0 10px var(--pulse-clr)}
        }

        /* Золотая подсветка для Expert */
        .gold{
          --pulse-clr: rgba(255,215,128,.26);
          border-color: rgba(250,204,21,.45);
        }
        .gold::before{
          background:
            linear-gradient(180deg, rgba(255,240,180,.38), rgba(255,255,255,.10) 46%, transparent 72%);
        }
        .gold{ background: rgba(255,245,200,.22); }

        /* Центральная капсула вокруг CHATGPT 5 */
        .glass-cta{
          position:relative; display:grid; grid-template-columns:1fr auto;
          align-items:center; justify-items:center; min-height:124px; padding:18px;
          border-radius:22px; overflow:hidden;
          background: rgba(255,255,255,.22);
          border: 1px solid rgba(15,23,42,.18);
          box-shadow: 0 26px 52px rgba(15,23,42,.14), 0 1px 0 rgba(255,255,255,.55) inset;
          -webkit-backdrop-filter: blur(18px) saturate(180%);
          backdrop-filter: blur(18px) saturate(180%);
        }
        .glass-cta::before{
          content:''; position:absolute; inset:0; pointer-events:none;
          background:
            radial-gradient(120% 140% at 10% 0%, rgba(255,255,255,.45), transparent 60%),
            linear-gradient(180deg, rgba(255,255,255,.12), transparent 40%),
            linear-gradient(0deg, rgba(255,255,255,.10), transparent 60%);
        }
        .gpt__shimmer{
          position:relative; z-index:1;
          justify-self:center; font-weight:900; letter-spacing:.02em;
          font-size:clamp(52px, 10vw, 70px); line-height:1;
          background: conic-gradient(from 180deg at 50% 50%, #9aa7ff, #6aa8ff, #a28bff, #ffdb86, #9aa7ff);
          background-size:200% 200%;
          -webkit-background-clip:text; background-clip:text; color:transparent;
          text-shadow:0 0 28px rgba(141,160,255,.18);
          animation: shimmer 6s ease-in-out infinite;
        }
        .gpt__chev{ position:relative; z-index:1; font-size:28px; opacity:.45; }
        @keyframes shimmer{ 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }

        /* Низ — полноширинная стеклянная панель */
        .dock{
          position:fixed; left:0; right:0; bottom:calc(env(safe-area-inset-bottom,0px));
          padding:14px 18px; text-align:center; font-weight:900; letter-spacing:.01em;
          color:#0f172a; z-index:10;
          background: rgba(255,255,255,.28);
          border-top: 1px solid rgba(15,23,42,.18);
          box-shadow: 0 -10px 30px rgba(15,23,42,.10), 0 1px 0 rgba(255,255,255,.55) inset;
          -webkit-backdrop-filter: blur(16px) saturate(180%);
          backdrop-filter: blur(16px) saturate(180%);
        }

        @media (min-width:760px){
          .center > *{ width:min(86vw, 760px); }
          .glass-cta{ min-height:140px; }
        }
      `}</style>
    </main>
  );
}
