/* path: app/home/page.tsx */
'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useMemo } from 'react';
import { STRINGS, readLocale, ensureLocaleCookie, type Locale } from '@/lib/i18n';

const BOT_USERNAME = process.env.NEXT_PUBLIC_BOT_USERNAME || 'LiveManagBot';
const STARTAPP_PARAM = process.env.NEXT_PUBLIC_STARTAPP_PARAM || 'home';

export default function HomePage() {
  // cookies и локаль
  useEffect(() => { try { ensureLocaleCookie({ sameSite: 'none', secure: true } as any); } catch {} }, []);
  const locale = useMemo<Locale>(() => readLocale(), []);
  const L = STRINGS[locale] ?? STRINGS.ru;

  // оформление и цвета из Telegram
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

  // ⚡️ Форсим fullscreen
  useEffect(() => {
    try {
      const tg: any = (window as any)?.Telegram?.WebApp;
      const params = new URLSearchParams(location.search);
      const fromDeeplink = Boolean(tg?.initDataUnsafe?.start_param || params.get('tgWebAppStartParam'));
      const alreadyTried = sessionStorage.getItem('__fs_fix_tried__');

      if (!fromDeeplink && !alreadyTried && tg) {
        sessionStorage.setItem('__fs_fix_tried__', '1');
        const link = `https://t.me/${BOT_USERNAME.replace(/^@/, '')}?startapp=${encodeURIComponent(STARTAPP_PARAM)}`;
        if (typeof tg.openTelegramLink === 'function') tg.openTelegramLink(link);
        else window.location.href = link;
      }
    } catch {}
  }, []);

  // cache-buster
  const suffix = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      const sp = new URLSearchParams(u.search);
      sp.set('welcomed', '1'); sp.set('_v', 'hm16');
      const id = u.searchParams.get('id'); if (id) sp.set('id', id);
      const s = sp.toString();
      return s ? `?${s}` : '?welcomed=1&_v=hm16';
    } catch { return '?welcomed=1&_v=hm16'; }
  }, []);
  const href = (p: string) => `${p}${suffix}` as Route;

  const dailyDesc  = (L as any).dailyDesc  || 'Быстрые ежедневные инструменты и автоматизации.';
  const expertDesc = (L as any).expertDesc || 'Продвинутые промпты, рецепты и профессиональные сценарии.';
  const appTitle   = (L as any).appTitle   || 'LiveManager';

  return (
    <main className="home">
      {/* Живой фон */}
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

        {/* CHATGPT 5 — своя стеклянная капсула (максимально прозрачная) */}
        <Link href={href('/home/ChatGPT')} className="glass-cta gpt" aria-label="CHATGPT 5">
          <span className="gpt__shimmer">CHATGPT&nbsp;5</span>
          <span className="gpt__chev">›</span>
        </Link>

        {/* Эксперт центр — нежное золото */}
        <Link href={href('/home/pro-plus')} className="card glass pulse gold raise" style={{ textDecoration: 'none' }}>
          <div className="card__text">
            <b className="card__title">{L.expert}</b>
            <span className="card__desc">{expertDesc}</span>
          </div>
          <span className="card__chev">›</span>
        </Link>
      </section>

      {/* OVERLAY: всё поверх любых слоёв/фильтров */}
      <div className="ui-overlay" aria-hidden={false}>
        {/* Золотая стеклянная кнопка «Пробный день 1₽» */}
        <Link href={href('/pro/max')} className="trial-pill" aria-label="Пробный день за 1 рубль">
          <span className="trial-pill__line">Пробный</span>
          <span className="trial-pill__line">день</span>
          <span className="trial-pill__line trial-pill__price">1₽</span>
        </Link>
      </div>

      {/* Узкая кнопка снизу по центру */}
      <a href={href('/cabinet')} className="dock" aria-label={L.cabinet}>
        <b>{L.cabinet}</b>
      </a>

      <style jsx>{`
        :global(html, body, #__next){ height:100%; overflow:hidden; }
        :global(*){ -webkit-tap-highlight-color: transparent; }
        :global(a), :global(a:visited){ text-decoration:none; color:inherit; }
        :global(.lm-bg){ display:none !important; }

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

        /* Фон (ускорено) */
        .bg{ position:fixed; inset:0; z-index:0; overflow:hidden;
             background: radial-gradient(120% 100% at 50% 0%, #dff5f1, #eaf3ff 70%); }
        .bg__conic{
          position:absolute; left:50%; top:50%;
          width:220vmax; height:220vmax; transform:translate(-50%,-50%) rotate(0deg);
          background: conic-gradient(from 0deg, rgba(42,214,205,.30), rgba(146,220,255,.28), rgba(255,210,160,.26), rgba(42,214,205,.30));
          filter: blur(60px) saturate(140%); will-change: transform;
          animation: spinBg 12.6s linear infinite;
          opacity:.55;
        }
        .bg__blobs{
          position:absolute; inset:-12%;
          background:
            radial-gradient(90vmax 60vmax at 18% 22%, rgba(42,214,205,.22), transparent 60%),
            radial-gradient(90vmax 60vmax at 82% 86%, rgba(92,170,255,.20), transparent 60%);
          will-change: transform; animation: floatBg 8.4s ease-in-out infinite alternate;
          opacity:.85;
        }
        @keyframes spinBg { to { transform: translate(-50%,-50%) rotate(360deg); } }
        @keyframes floatBg { 0% { transform: translate3d(0,0,0) scale(1); } 100%{ transform: translate3d(-3%,2%,0) scale(1.02); } }

        .hdr{ text-align:center; margin-bottom:10px; position:relative; z-index:2; }
        .title{
          margin:6px 0 4px; font-weight:800; letter-spacing:-.02em;
          font-size:32px; line-height:1.1;
          color:var(--text,#0f172a);
          -webkit-text-fill-color: currentColor !important;
          background:none !important;
        }
        .sub{ opacity:.75; margin:0; }

        .stack{
          display:grid; gap:16px; align-content:start; justify-items:center;
          padding-bottom: calc(env(safe-area-inset-bottom,0px) + 98px);
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
          50%{opacity:.9; box-shadow:0 0 0 12px color-mix(in oklab, var(--accent,#4c82ff) 12%, transparent)}
        }

        /* CHATGPT 5 — предельно прозрачное стекло */
        .glass-cta{
          position:relative; z-index:3; isolation:isolate;
          border-radius:22px; min-height:120px; padding:20px 18px;
          display:grid; grid-template-columns:1fr auto; align-items:center; justify-items:center;
          background: rgba(255,255,255,.06) !important;
          border: 1px solid rgba(15,23,42,.12) !important;
          box-shadow: 0 8px 16px rgba(15,23,42,.08), inset 0 1px 0 rgba(255,255,255,.45) !important;
          -webkit-backdrop-filter: blur(10px) saturate(130%) !important;
                  backdrop-filter: blur(10px) saturate(130%) !important;
        }
        .glass-cta::before{
          content:''; position:absolute; inset:0; border-radius:inherit; pointer-events:none; z-index:0;
          background:
            radial-gradient(120% 140% at 10% 0%, rgba(255,255,255,.30), transparent 62%),
            linear-gradient(180deg, rgba(255,255,255,.08), transparent 45%) !important;
        }
        .gpt__shimmer{
          position:relative; z-index:1; display:inline-block;
          justify-self:center; font-weight:900; letter-spacing:.02em;
          font-size:clamp(50px, 10vw, 68px); line-height:1;
          background:conic-gradient(from 180deg at 50% 50%, #9aa7ff, #6aa8ff, #a28bff, #ffdb86, #9aa7ff);
          background-size:200% 200%;
          -webkit-background-clip:text; background-clip:text; color:transparent;
          -webkit-text-fill-color: transparent;
          text-shadow:0 0 28px rgba(141,160,255,.18);
          animation: shimmer 6s ease-in-out infinite, gptPulse 1.9s ease-in-out infinite;
        }
        .gpt__chev{ position:relative; z-index:1; font-size:28px; opacity:.45; }
        @keyframes shimmer{ 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes gptPulse{
          0%,100%{ opacity:.92; filter:brightness(1); text-shadow:0 0 24px rgba(141,160,255,.18); }
          50%    { opacity:1;    filter:brightness(1.18); text-shadow:0 0 46px rgba(141,160,255,.36); }
        }

        /* Эксперт центр — мягкое золото */
        .raise{ z-index:2; isolation:isolate; }
        :global(.lm-page) .card.gold{
          background:
            linear-gradient(140deg, rgba(255,225,150,.22), rgba(255,205,120,.10)),
            rgba(255,255,255,.20) !important;
          border: 1px solid rgba(215,170,60,.55) !important;
          box-shadow: 0 22px 44px rgba(215,170,60,.20), inset 0 1px 0 rgba(255,245,205,.85) !important;
        }
        :global(.lm-page) .card.gold::before{
          content:''; position:absolute; inset:0; border-radius:18px; pointer-events:none; z-index:0;
          background:
            radial-gradient(120% 160% at 12% 0%, rgba(255,220,140,.35), rgba(255,220,140,0) 65%),
            linear-gradient(180deg, rgba(255,255,255,.34), rgba(255,255,255,.08) 50%, transparent 80%) !important;
        }

        /* ======= СЛОЙ ПОВЕРХ ВСЕГО ======= */
        .ui-overlay{
          position:fixed; inset:0;
          z-index:2147483647;            /* max-safe */
          pointer-events:none;           /* не блокируем скролл/клики под слоем */
        }

        /* Кнопка пробного дня — золотой стеклянный кружок */
        .trial-pill{
          position:absolute;
          left:50%; transform:translateX(-50%) translateZ(0);
          bottom: calc(env(safe-area-inset-bottom,0px) + 68px);
          width:92px; height:92px; border-radius:999px;
          display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px;
          font-size:13px; font-weight:700; text-align:center;
          pointer-events:auto;            /* кликабельна, несмотря на pointer-events:none у оверлея */
          background:
            radial-gradient(120% 160% at 15% 0%, rgba(255,240,200,.85), rgba(255,215,140,.45)),
            rgba(255,255,255,.80);
          border:1px solid rgba(215,170,60,.70);
          box-shadow:0 14px 32px rgba(215,170,60,.45), inset 0 1px 0 rgba(255,255,255,.85);
          -webkit-backdrop-filter: blur(14px) saturate(170%);
                  backdrop-filter: blur(14px) saturate(170%);
          color:#3a2600;
          isolation:isolate;
        }
        .trial-pill__line{ line-height:1.1; }
        .trial-pill__price{ font-size:16px; margin-top:3px; }

        /* Узкая кнопка снизу по центру */
        .dock{
          position:fixed;
          left:50%; right:auto;
          transform: translateX(-50%);
          bottom: calc(env(safe-area-inset-bottom,0px) + 8px);
          width: min(560px, 50vw);
          padding: 14px 18px;
          text-align:center; font-weight:800;
          color:#0f172a; z-index:2;
          background: rgba(255,255,255,.92);
          border:1px solid rgba(15,23,42,.16);
          border-radius: 14px;
          box-shadow:0 10px 28px rgba(15,23,42,.12), inset 0 1px 0 rgba(255,255,255,.68);
          -webkit-backdrop-filter: blur(12px) saturate(160%);
                  backdrop-filter: blur(12px) saturate(160%);
        }
      `}</style>
    </main>
  );
}
