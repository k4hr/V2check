/* path: app/home/page.tsx */
'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useMemo, useState } from 'react';
import { STRINGS, readLocale, setLocaleEverywhere, ensureLocaleCookie, type Locale } from '@/lib/i18n';
import { detectPlatform } from '@/lib/platform';

// Новости: данные и компонент
import { NEWS, type NewsItem } from './news';
import NewsSection from './NewsSection';

const LOCALES = [
  { code: 'ru' as const, label: 'Русский'     },
  { code: 'uk' as const, label: 'Українська'  },
  { code: 'be' as const, label: 'Беларуская'  },
  { code: 'kk' as const, label: 'Қазақша'     },
  { code: 'uz' as const, label: "Oʻzbekcha"   },
  { code: 'ky' as const, label: 'Кыргызча'    },
  { code: 'fa' as const, label: 'فارسی'       },
  { code: 'hi' as const, label: 'हिन्दी'      },
  { code: 'en' as const, label: 'English'     },
];

export default function HomePage(){
  useEffect(()=>{ try{ ensureLocaleCookie({ sameSite: 'none', secure: true } as any); }catch{} }, []);

  const [open,setOpen]=useState(false);
  const currentLocale=useMemo<Locale>(()=>readLocale(),[]);
  const [pendingLocale,setPendingLocale]=useState<Locale>(currentLocale);
  const [saving,setSaving]=useState(false);
  const L=STRINGS[currentLocale];
  const platform = useMemo(() => detectPlatform(), []);

  useEffect(()=>{
    const w:any=window;
    try{ w?.Telegram?.WebApp?.ready?.(); w?.Telegram?.WebApp?.expand?.(); }catch{}
    try{ document.documentElement.lang=currentLocale; }catch{}
    if(open) window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'});
  },[currentLocale,open]);

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
    const url=new URL(window.location.href);
    url.searchParams.set('_lng',String(Date.now()));
    window.location.replace(url.toString());
  }
  function onCancel(){ setPendingLocale(currentLocale); setOpen(false); }

  // Новости по локали
  const visibleNews: NewsItem[] = useMemo(
    () => NEWS.filter(n => !n.locale || n.locale === (currentLocale === 'en' ? 'en' : 'ru')),
    [currentLocale]
  );

  return (
    <main>
      <h1 style={{textAlign:'center'}}>{L.appTitle}</h1>
      <p className="lm-subtitle" style={{textAlign:'center'}}>{L.subtitle}</p>

      <div className="lm-grid" style={{marginTop:16}}>
        {/* Герой: стеклянно-золотая плашка */}
        <Link
          href={href('/home/ChatGPT')}
          className="card hero-card"
          style={{ textDecoration:'none' }}
        >
          <span style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <span className="card__title gold-text" style={{fontSize:18}}>
              CHATGPT 5
            </span>
          </span>
          <span className="card__chev">›</span>
        </Link>

        <Link href={href('/cabinet')} className="card" style={{textDecoration:'none'}}>
          <span className="card__left">
            <span className="card__title">{L.cabinet}</span>
          </span>
          <span className="card__chev">›</span>
        </Link>

        <Link href={href('/pro')} className="card card--pro" style={{textDecoration:'none'}}>
          <span className="card__left">
            <span className="card__title">{L.buy} <span className="badge">{L.pro} / {L.proplus}</span></span>
          </span>
          <span className="card__chev">›</span>
        </Link>

        <Link href={href('/home/pro')} className="card card--pro" style={{textDecoration:'none'}}>
          <span className="card__left">
            <span className="card__title">{L.daily} <span className="badge">{L.pro}</span></span>
          </span>
          <span className="card__chev">›</span>
        </Link>

        <Link href={href('/home/pro-plus')} className="card card--proplus" style={{textDecoration:'none'}}>
          <span className="card__left">
            <span className="card__title">{L.expert} <span className="badge badge--gold">{L.proplus}</span></span>
          </span>
          <span className="card__chev">›</span>
        </Link>
      </div>

      {platform !== 'vk' && (
        <>
          <div style={{marginTop:18,display:'flex',justifyContent:'center'}}>
            <button
              type="button"
              onClick={()=>setOpen(v=>!v)}
              className="ghost-link"
              style={{textDecoration:'none'}}
              aria-expanded={open}
            >
              {L.changeLang}
            </button>
          </div>

          {open && (
            <div
              style={{
                marginTop:12,
                border:'1px dashed rgba(45,126,247,.25)',
                background:'rgba(255,255,255,.62)',
                backdropFilter:'blur(10px)',
                borderRadius:14,
                padding:14,
                maxWidth:560,
                marginLeft:'auto',
                marginRight:'auto'
              }}
            >
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
                        background: active ? 'rgba(255,255,255,.82)' : 'rgba(255,255,255,.68)',
                        border: active ? '1px solid #6573ff' : '1px solid var(--card-border)',
                        boxShadow: active ? '0 0 0 3px rgba(101,115,255,.15) inset' : 'none'
                      }}
                    >
                      <span style={{fontWeight:600}}>{l.label}</span>
                    </button>
                  );
                })}
              </div>

              <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:12}}>
                <button type="button" onClick={onCancel} className="list-btn" style={{padding:'10px 14px',borderRadius:12}}>
                  {STRINGS[currentLocale].cancel}
                </button>
                <button
                  type="button"
                  onClick={onSave}
                  disabled={saving || pendingLocale===currentLocale}
                  className="list-btn"
                  style={{
                    padding:'10px 14px',
                    borderRadius:12,
                    background: 'linear-gradient(180deg, rgba(45,126,247,.12), rgba(45,126,247,.08))',
                    border: '1px solid #4b57b3',
                    opacity: saving ? 0.7 : 1
                  }}
                >
                  {STRINGS[currentLocale].save}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <NewsSection
        locale={currentLocale === 'en' ? 'en' : 'ru'}
        items={visibleNews}
      />
    </main>
  );
}
