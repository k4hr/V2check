/* path: app/home/page.tsx */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Route } from 'next';
import { useEffect, useMemo, useState } from 'react';
import { STRINGS, readLocale, setLocaleEverywhere, ensureLocaleCookie, type Locale } from '@/lib/i18n';
import { detectPlatform } from '@/lib/platform';

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

/** -------- Новости: типы и заглушки -------- */
type NewsItem = {
  id: string;
  title: string;
  tag?: string;           // например: "-70%", "Розыгрыш", "Апдейт"
  image: string;          // абсолютный или относительный URL
  href: string;           // куда ведём (внутренняя/внешняя)
  locale?: 'ru' | 'en';   // можно помечать локаль; без неё — показываем всем
};

const NEWS_FALLBACK: NewsItem[] = [
  {
    id: 'sale-pro',
    title: 'Скидки на подписку Pro / Pro+',
    tag: '-70%',
    image: '/news/pro-sale.jpg',         // положи в public/news/…
    href: '/pro'
  },
  {
    id: 'giveaway',
    title: 'Розыгрыш трёх Pro+ на месяц',
    tag: 'Розыгрыш',
    image: '/news/giveaway.jpg',
    href: '/news/giveaway'
  },
  {
    id: 'update-oct',
    title: 'Обновление: оплата картой (ЮKassa)',
    tag: 'Апдейт',
    image: '/news/yookassa.jpg',
    href: '/changelog#payments'
  }
];

/** Подгружаем новости с API, если есть, иначе используем заглушки */
async function loadNews(): Promise<NewsItem[]> {
  try{
    const res = await fetch('/api/news', { method:'GET' });
    if(!res.ok) throw new Error('no api');
    const data = await res.json();
    if (!Array.isArray(data)) return NEWS_FALLBACK;
    // лёгкая валидация структуры
    return data.filter(Boolean).map((x:any):NewsItem => ({
      id: String(x.id ?? cryptoRandomId()),
      title: String(x.title ?? 'Новости'),
      tag: x.tag ? String(x.tag) : undefined,
      image: String(x.image ?? '/news/placeholder.jpg'),
      href: String(x.href ?? '/news'),
      locale: x.locale === 'en' ? 'en' : x.locale === 'ru' ? 'ru' : undefined,
    }));
  }catch{
    return NEWS_FALLBACK;
  }
}

// минимальный генератор id без зависимостей
function cryptoRandomId(){
  try{
    const a = new Uint8Array(8);
    crypto.getRandomValues(a);
    return Array.from(a, b=>b.toString(16).padStart(2,'0')).join('');
  }catch{ return String(Date.now()); }
}

export default function HomePage(){
  useEffect(()=>{ try{ ensureLocaleCookie({ sameSite: 'none', secure: true } as any); }catch{} }, []);

  const [open,setOpen]=useState(false);
  const currentLocale=useMemo<Locale>(()=>readLocale(),[]);
  const [pendingLocale,setPendingLocale]=useState<Locale>(currentLocale);
  const [saving,setSaving]=useState(false);
  const L=STRINGS[currentLocale];
  const platform = useMemo(() => detectPlatform(), []);

  // -------- состояние новостей --------
  const [news, setNews] = useState<NewsItem[]>([]);
  useEffect(()=>{ loadNews().then(setNews).catch(()=>setNews(NEWS_FALLBACK)); }, []);

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
    haptic('medium');
    const url=new URL(window.location.href);
    url.searchParams.set('_lng',String(Date.now()));
    window.location.replace(url.toString());
  }
  function onCancel(){ setPendingLocale(currentLocale); setOpen(false); haptic('light'); }

  // фильтруем новости по локали (если указана)
  const visibleNews = useMemo(
    () => news.filter(n => !n.locale || n.locale === (currentLocale === 'en' ? 'en' : 'ru')),
    [news, currentLocale]
  );

  return (
    <main>
      <h1 style={{textAlign:'center'}}>{L.appTitle}</h1>
      <p className="lm-subtitle" style={{textAlign:'center'}}>{L.subtitle}</p>

      <div className="lm-grid" style={{marginTop:16}}>
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

        <Link href={href('/pro')} className="card card--pro" style={{textDecoration:'none'}}>
          <span className="card__left"><span className="card__icon">⭐</span><span className="card__title">{L.buy} <span className="badge">{L.pro} / {L.proplus}</span></span></span>
          <span className="card__chev">›</span>
        </Link>

        <Link href={href('/home/pro')} className="card card--pro" style={{textDecoration:'none'}}>
          <span className="card__left"><span className="card__icon">🧰</span><span className="card__title">{L.daily} <span className="badge">{L.pro}</span></span></span>
          <span className="card__chev">›</span>
        </Link>

        <Link href={href('/home/pro-plus')} className="card card--proplus" style={{textDecoration:'none'}}>
          <span className="card__left"><span className="card__icon">🚀</span><span className="card__title">{L.expert} <span className="badge badge--gold">{L.proplus}</span></span></span>
          <span className="card__chev">›</span>
        </Link>
      </div>

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

      {/* ---------- Блок новостей (снизу) ---------- */}
      <section className="news">
        <div className="news__head">
          <h2 className="news__title">{currentLocale === 'en' ? 'News & promos' : 'Новости и акции'}</h2>
          <Link href="/news" className="news__more">{currentLocale === 'en' ? 'All news' : 'Все новости'} ›</Link>
        </div>

        <div className="news__list" role="list">
          {visibleNews.map(item => (
            <Link key={item.id} href={item.href as Route} className="news-card" role="listitem">
              <div className="news-card__media">
                {/* fill-responsive обложка */}
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 75vw, 320px"
                  priority={false}
                  style={{objectFit:'cover'}}
                />
                {item.tag ? <span className="news-card__tag">{item.tag}</span> : null}
              </div>
              <div className="news-card__body">
                <div className="news-card__title">{item.title}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <style jsx>{`
        /* ---------- Новости ---------- */
        .news { margin: 26px auto 10px; max-width: 980px; padding: 0 10px; }
        .news__head { display:flex; align-items:baseline; justify-content:space-between; gap:12px; margin: 0 2px 10px; }
        .news__title { margin:0; font-size: 18px; opacity:.95; }
        .news__more { font-size: 13px; opacity:.8; text-decoration:none; }

        .news__list {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: 80%;
          gap: 12px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          padding-bottom: 2px;
        }
        .news-card {
          position: relative;
          display: grid;
          grid-template-rows: 160px auto;
          border-radius: 14px;
          overflow: hidden;
          min-height: 220px;
          background: #0f1320;
          border: 1px solid rgba(255,255,255,.06);
          text-decoration: none;
          color: inherit;
          scroll-snap-align: start;
        }
        .news-card__media { position: relative; height: 160px; }
        .news-card__tag {
          position: absolute; left: 10px; top: 10px;
          padding: 4px 8px; border-radius: 10px;
          background: rgba(120,170,255,.22);
          border: 1px solid rgba(120,170,255,.35);
          font-size: 12px; white-space: nowrap;
          backdrop-filter: blur(2px);
        }
        .news-card__body { padding: 10px 12px; display:flex; align-items:center; }
        .news-card__title { font-weight: 700; line-height: 1.25; }

        /* Широкие экраны — грид 3–4 колонки */
        @media (min-width: 760px) {
          .news__list {
            grid-auto-flow: initial;
            grid-auto-columns: initial;
            grid-template-columns: repeat(3, minmax(0,1fr));
            overflow: visible;
          }
          .news-card { grid-template-rows: 180px auto; min-height: 230px; }
        }
        @media (min-width: 1000px) {
          .news__list { grid-template-columns: repeat(4, minmax(0,1fr)); }
        }
      `}</style>
    </main>
  );
}
