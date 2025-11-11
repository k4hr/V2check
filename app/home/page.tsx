/* path: app/home/page.tsx */
'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useMemo } from 'react';
import { STRINGS, readLocale, ensureLocaleCookie, type Locale } from '@/lib/i18n';
import MiniDock from '@/app/components/MiniDock';

export default function HomePage(){
  useEffect(()=>{ try{ ensureLocaleCookie({ sameSite:'none', secure:true } as any);}catch{} },[]);
  const locale = useMemo<Locale>(()=>readLocale(),[]);
  const L = STRINGS[locale] ?? STRINGS.ru;

  useEffect(()=>{
    const w:any=window;
    try{ w?.Telegram?.WebApp?.ready?.(); w?.Telegram?.WebApp?.expand?.(); }catch{}
    try{ document.documentElement.lang=locale; }catch{}
  },[locale]);

  const suffix = useMemo(()=>{
    try{
      const u=new URL(window.location.href);
      const sp=new URLSearchParams(u.search);
      sp.set('welcomed','1');
      const id=u.searchParams.get('id'); if(id) sp.set('id',id);
      const s=sp.toString(); return s?`?${s}`:'?welcomed=1';
    }catch{ return '?welcomed=1'; }
  },[]);
  const href = (p:string)=>`${p}${suffix}` as Route;

  // описания с фолбэками
  const dailyDesc   = (L as any).dailyDesc   || (locale==='en' ? 'Quick daily tools and automations.' : 'Быстрые ежедневные инструменты и автоматизации.');
  const expertDesc  = (L as any).expertDesc  || (locale==='en' ? 'Advanced prompts, recipes and pro workflows.' : 'Продвинутые промпты, рецепты и профессиональные сценарии.');

  return (
    <main className="home">
      <h1 className="title">{L.appTitle}</h1>
      <p className="subtitle">{L.subtitle}</p>

      {/* Бенто: большой герой и две вытянутые плитки */}
      <section className="bento">
        {/* HERO CHATGPT 5 */}
        <Link href={href('/home/ChatGPT')} className="tile tile--hero glass" aria-label="Открыть ChatGPT 5">
          <div className="hero__center">
            <span className="hero__label">CHATGPT&nbsp;5</span>
          </div>
          <span className="chev" aria-hidden>›</span>
          <span className="hero__glow" aria-hidden />
        </Link>

        {/* ЕЖЕДНЕВНЫЕ ЗАДАЧИ */}
        <Link href={href('/home/pro')} className="tile tile--tall glass">
          <div className="tile__inner">
            <div className="tile__title">{L.daily}</div>
            <div className="tile__desc">{dailyDesc}</div>
          </div>
          <span className="chev" aria-hidden>›</span>
        </Link>

        {/* ЭКСПЕРТ-ЦЕНТР (пульс) */}
        <Link href={href('/home/pro-plus')} className="tile tile--tall glass tile--pulse">
          <div className="tile__inner">
            <div className="tile__title">{L.expert}</div>
            <div className="tile__desc">{expertDesc}</div>
          </div>
          <span className="chev" aria-hidden>›</span>
          <span className="pulse__halo" aria-hidden />
        </Link>
      </section>

      {/* отступ под док */}
      <div style={{height:96}} />

      {/* мини-док снизу */}
      <MiniDock />

      <style jsx>{`
        .home{ padding:20px; max-width:860px; margin:0 auto; }
        .title{ text-align:center; margin:0 0 6px; }
        .subtitle{ text-align:center; opacity:.8; margin:0 0 14px; }

        /* белое стекло — прозрачно и единообразно */
        .glass{
          background: rgba(255,255,255,.68);
          color:#0d1220;
          border:1px solid rgba(0,0,0,.08);
          box-shadow: 0 12px 32px rgba(17,23,40,.10), inset 0 0 0 1px rgba(255,255,255,.55);
          backdrop-filter: saturate(160%) blur(14px);
          -webkit-backdrop-filter: saturate(160%) blur(14px);
        }

        /* сетка */
        .bento{
          display:grid; gap:14px;
          grid-template-columns:repeat(2,minmax(0,1fr));
          grid-template-areas:
            "hero hero"
            "daily expert";
        }
        .tile{
          position:relative; border-radius:18px; padding:16px;
          display:grid; grid-template-columns:1fr auto; align-items:center;
          text-decoration:none; color:inherit; overflow:hidden;
          transition: transform .12s ease, box-shadow .12s ease, border-color .12s ease;
        }
        .tile:hover{ transform: translateY(-1px); }
        .chev{ position:absolute; right:14px; top:50%; transform:translateY(-50%); opacity:.45; font-size:20px; }

        /* HERO */
        .tile--hero{ grid-area:hero; min-height:128px; }
        .hero__center{ position:absolute; inset:0; display:grid; place-items:center; pointer-events:none; }
        .hero__label{
          font-weight:900; letter-spacing:.06em;
          font-size: clamp(28px, 7.4vw, 56px);
          background: conic-gradient(from 180deg at 50% 50%, #9aa7ff, #6aa8ff, #a28bff, #ffdb86, #9aa7ff);
          background-size:200% 200%;
          -webkit-background-clip:text; background-clip:text; color:transparent;
          animation: shimmer 7s ease-in-out infinite;
          text-shadow: 0 0 26px rgba(141,160,255,.22);
        }
        .hero__glow{
          position:absolute; inset:-30%;
          background: radial-gradient(60% 60% at 40% 30%, rgba(140,160,255,.25), transparent 60%);
          filter: blur(20px); z-index:-1; pointer-events:none;
        }
        @keyframes shimmer { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }

        /* Вытянутые карточки */
        .tile--tall{ min-height:160px; align-items:flex-start; }
        .bento :global(a:nth-of-type(2)){ grid-area: daily; }
        .bento :global(a:nth-of-type(3)){ grid-area: expert; }

        .tile__inner{ display:flex; flex-direction:column; gap:8px; }
        .tile__title{ font-weight:900; letter-spacing:.02em; }
        .tile__desc{ opacity:.8; line-height:1.25; font-size:14px; padding-right:28px; }

        /* Пульс для эксперт-центра */
        .tile--pulse{ animation: softPulse 2.8s ease-in-out infinite; }
        .pulse__halo{
          position:absolute; inset:-20%;
          background: radial-gradient(40% 40% at 50% 50%, rgba(140,160,255,.25), transparent 60%);
          filter: blur(18px); z-index:-1; pointer-events:none;
          animation: halo 2.8s ease-in-out infinite;
        }
        @keyframes softPulse{ 0%,100%{ box-shadow: 0 12px 32px rgba(17,23,40,.10), inset 0 0 0 1px rgba(255,255,255,.55); }
                               50%    { box-shadow: 0 16px 40px rgba(17,23,40,.14), inset 0 0 0 1px rgba(255,255,255,.62); } }
        @keyframes halo{ 0%,100%{ opacity:.5; transform:scale(1);} 50%{ opacity:.9; transform:scale(1.04);} }

        @media (min-width:760px){
          .tile--hero{ min-height:150px; }
          .tile--tall{ min-height:180px; }
        }
      `}</style>
    </main>
  );
}
