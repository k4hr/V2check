/* path: app/home/page.tsx */
'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useMemo, useState } from 'react';
import { STRINGS, readLocale, setLocaleEverywhere, ensureLocaleCookie, type Locale } from '@/lib/i18n';
import { detectPlatform } from '@/lib/platform';
import RaffleBanner from '@/components/RaffleBanner';

const LOCALES = [
  { code: 'ru' as const, label: 'Русский',     flag: '🇷🇺' },
  { code: 'uk' as const, label: 'Українська',  flag: '🇺🇦' },
  { code: 'be' as const, label: 'Беларуская',  flag: '🇧🇾' },
  { code: 'kk' as const, label: 'Қазақша',     flag: '🇰🇿' },
  { code: 'uz' as const, label: "Oʻzbekcha",   flag: '🇺🇿' },
  { code: 'ky' as const, label: 'Кыргызча',    flag: '🇰🇬' },
  { code: 'fa' as const, label: 'فارسی',       flag: '🇮🇷' },
  { code: 'hi' as const, label: 'हिन्दी',      flag: '🇮🇳' },
  { code: 'en' as const, label: 'English',     flag: '🇬🇧' },
];

function haptic(type:'light'|'medium'='light'){
  try{ (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);}catch{}
}

/** Даты розыгрыша — поменяй при необходимости */
const RAFFLE_START = '2025-10-25T00:00:00Z';
const RAFFLE_END   = '2025-11-10T23:59:59Z';

export default function HomePage(){
  // если пользователь впервые — создадим cookie из автоопределения
  useEffect(()=>{ try{ ensureLocaleCookie({ sameSite: 'none', secure: true } as any); }catch{} }, []);

  const [open,setOpen]=useState(false);
  const currentLocale=useMemo<Locale>(()=>readLocale(),[]);
  const [pendingLocale,setPendingLocale]=useState<Locale>(currentLocale);
  const [saving,setSaving]=useState(false);
  const L=STRINGS[currentLocale];

  // определяем платформу, чтобы скрыть кнопку смены языка во ВК
  const platform = useMemo(() => detectPlatform(), []);

  useEffect(()=>{
    const w:any=window;
    try{ w?.Telegram?.WebApp?.ready?.(); w?.Telegram?.WebApp?.expand?.(); }catch{}
    try{ document.documentElement.lang=currentLocale; }catch{}
    if(open) window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'});
  },[currentLocale,open]);

  // ВСЕГДА тащим welcomed=1 + сохраняем id (если был)
  const linkSuffix = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      const sp = new URLSearchParams(u.search);
      sp.set('welcomed', '1');
      const id = u.searchParams.get('id');
      if (id) sp.set('id', id);
      const s = sp.toString();
      return s ? `?${s}` : '';
    } catch { return '?welcomed=1'; }
  }, []);

  const href = (p:string) => `${p}${linkSuffix}` as Route;

  async function onSave(){
    if(saving) return;
    setSaving(true);
    setLocaleEverywhere(pendingLocale);
    haptic('medium');
    // перезагрузка для надёжного применения
    const url=new URL(window.location.href);
    url.searchParams.set('_lng',String(Date.now()));
    window.location.replace(url.toString());
  }
  function onCancel(){ setPendingLocale(currentLocale); setOpen(false); haptic('light'); }

  return (
    <main>
      <h1 style={{textAlign:'center'}}>{L.appTitle}</h1>
      <p className="lm-subtitle" style={{textAlign:'center'}}>{L.subtitle}</p>

      {/* Баннер розыгрыша */}
      <RaffleBanner startAt={RAFFLE_START} endAt={RAFFLE_END} />

      <div className="lm-grid" style={{marginTop:16}}>
        {/* CHATGPT 5 — золотая, по центру, без иконки и бейджа */}
        <Link
          href={href('/home/ChatGPT')}
          className="card"
          style={{
            textDecoration:'none',
            background:'linear-gradient(135deg,#2f2411 0%, #3b2c12 45%, #4b3513 100%)',
            border:'1px solid #ffd278',
            boxShadow:'0 14px 36px rgba(255,191,73,.28), inset 0 0 0 1px rgba(255,255,255,.06)'
          }}
        >
          <span style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <span className="card__title" style={{fontWeight:800,letterSpacing:.4}}>
              CHATGPT 5
            </span>
          </span>
          <span className="card__chev">›</span>
        </Link>

        <Link href={href('/cabinet')} className="card" style={{textDecoration:'none'}}>
          <span className="card__left"><span className="card__icon">👤</span><span className="card__title">{L.cabinet}</span></span>
          <span className="card__chev">›</span>
        </Link>

        {/* Покупка подписки — оставляем ваши страницы оплаты */}
        <Link href={href('/pro')} className="card card--pro" style={{textDecoration:'none'}}>
          <span className="card__left"><span className="card__icon">⭐</span><span className="card__title">{L.buy} <span className="badge">{L.pro} / {L.proplus}</span></span></span>
          <span className="card__chev">›</span>
        </Link>

        {/* Ежедневные задачи — ХАБ Pro */}
        <Link href={href('/home/pro')} className="card card--pro" style={{textDecoration:'none'}}>
          <span className="card__left"><span className="card__icon">🧰</span><span className="card__title">{L.daily} <span className="badge">{L.pro}</span></span></span>
          <span className="card__chev">›</span>
        </Link>

        {/* Эксперт-центр — ХАБ Pro+ */}
        <Link href={href('/home/pro-plus')} className="card card--proplus" style={{textDecoration:'none'}}>
          <span className="card__left"><span className="card__icon">🚀</span><span className="card__title">{L.expert} <span className="badge badge--gold">{L.proplus}</span></span></span>
          <span className="card__chev">›</span>
        </Link>
      </div>

      {/* Кнопка «Сменить язык» и блок выбора — скрываем ТОЛЬКО во ВК */}
      {platform !== 'vk' && (
        <>
          <div style={{marginTop:18,display:'flex',justifyContent:'center'}}>
            <button
              type="button"
              onClick={()=>{setOpen(v=>!v);haptic('light');}}
              className="ghost-link"
              style={{textDecoration:'none'}}
              aria-expanded={open}
            >
              🌐 {L.changeLang}
            </button>
          </div>

          {open && (
            <div style={{marginTop:12,border:'1px dashed #4a4e6a',background:'#141823',borderRadius:14,padding:14,maxWidth:560,marginLeft:'auto',marginRight:'auto'}}>
              <div style={{marginBottom:10,opacity:.8,fontSize:12,letterSpacing:.2}}>{L.chooseLang}</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:8}}>
                {LOCALES.map(l=>{
                  const active=pendingLocale===l.code;
                  return (
                    <button
                      key={l.code}
                      onClick={()=>setPendingLocale(l.code)}
                      className="list-btn"
                      style={{
                        display:'flex',alignItems:'center',gap:10,borderRadius:12,padding:'10px 12px',
                        background:active?'#1e2434':'#171a21',
                        border:active?'1px solid #6573ff':'1px solid var(--card-border)',
                        boxShadow:active?'0 0 0 3px rgba(101,115,255,.15) inset':'none'
                      }}
                    >
                      <span style={{width:22,textAlign:'center'}}>{l.flag}</span>
                      <span style={{fontWeight:600}}>{l.label}</span>
                    </button>
                  );
                })}
              </div>

              <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:12}}>
                <button type="button" onClick={onCancel} className="list-btn" style={{padding:'10px 14px',borderRadius:12,background:'#1a1f2b',border:'1px solid var(--card-border)'}}>
                  {STRINGS[currentLocale].cancel}
                </button>
                <button
                  type="button"
                  onClick={onSave}
                  disabled={saving || pendingLocale===currentLocale}
                  className="list-btn"
                  style={{padding:'10px 14px',borderRadius:12,background:saving?'#2a3150':'#2e3560',border:'1px solid #4b57b3',opacity: saving ? 0.7 : 1}}
                >
                  {STRINGS[currentLocale].save}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
