'use client';
import React, { useEffect, useState } from 'react';
import TopBar from '../components/TopBar';
import LockBadge from '../components/LockBadge';
import { isPro } from '../lib/subscription';
import { canOpen, remaining, registerOpen } from '../lib/freeReads';
import { isFav, toggleFav } from '../lib/favorites';

type Law = { id: string; title: string; updated_at: string; category: string };

const CAT_LABEL: Record<string,string> = {
  'codes':'📚 Кодексы РФ',
  'constitution':'📜 Конституция РФ',
  'federal':'⚖️ Федеральные законы',
  'army':'🪖 Уставы ВС РФ',
  'intl':'🌍 Международные акты',
  'cases':'👩‍⚖️ Судебная практика'
};

export default function Library(){
  const [laws, setLaws] = useState<Law[]>([]);
  const [pro, setPro] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [rem, setRem] = useState<number>(2);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try { const WebApp = (await import('@twa-dev/sdk')).default; WebApp?.ready?.(); WebApp?.expand?.(); } catch {}
      fetch('/content/index.json').then(r=>r.json()).then(setLaws).catch(()=>setErr('Не удалось загрузить список'));
      const p=isPro(); setPro(p); setRem(remaining(p));
    })();
  }, []);

  const filtered = laws.filter(l => l.title.toLowerCase().includes(query.toLowerCase()));

  const grouped: Record<string, Law[]> = {};
  for (const l of filtered){ const k=l.category||'federal'; (grouped[k]??=[]).push(l); }

  const onOpen=(law:Law)=>{
    const p=isPro();
    if (!canOpen(law.id,p)){ window.location.href='/pro'; return; }
    registerOpen(law.id,p);
    window.location.href=`/doc/${law.id}`;
  };

  return (
    <main>
      <TopBar showBack />
      <div style={{padding:16, maxWidth:760, margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center', marginBottom:8}}>
          <h1 style={{fontSize:22, fontWeight:800, margin:0}}>Каталог</h1>
          <button onClick={()=>setSearchOpen(true)} style={{background:'#1976d2', color:'#fff', border:'none', borderRadius:10, padding:'8px 12px'}}>🔎 Быстрый поиск</button>
        </div>
        {!pro && <div style={{opacity:.85,fontSize:13,marginBottom:12}}>Сегодня бесплатно: {rem} документа(ов). Для безлимита оформите <a href="/pro" style={{color:'#8ab4ff'}}>Pro</a>.</div>}
        {err && <div>{err}</div>}

        {Object.keys(grouped).map(cat => (
          <section key={cat} style={{margin:'18px 0'}}>
            <h2 style={{fontSize:16, fontWeight:700, opacity:.9, margin:'6px 0 10px'}}>{CAT_LABEL[cat]||cat}</h2>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:12}}>
              {grouped[cat].map(law => {
                const locked = !isPro() && !canOpen(law.id,false);
                const fav = isFav(law.id);
                return (
                  <button key={law.id} onClick={()=>onOpen(law)} style={{textAlign:'left', border:'1px solid #1b1f27', borderRadius:14, padding:14, background:'#12161c', color:'#e7e7e7'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div style={{fontWeight:700}}>{law.title}</div>
                      <LockBadge locked={locked} />
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center', marginTop:6, fontSize:12, opacity:.75}}>
                      <div>обновлено {law.updated_at}</div>
                      <div onClick={(e)=>{e.stopPropagation(); toggleFav(law.id);}} style={{cursor:'pointer'}}>{fav? '★' : '☆'}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {searchOpen && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,.6)'}} onClick={()=>setSearchOpen(false)}>
          <div onClick={(e)=>e.stopPropagation()} style={{maxWidth:760, margin:'8vh auto', background:'#0f1114', border:'1px solid #1b1f27', borderRadius:16, padding:16}}>
            <h3 style={{marginTop:0}}>Быстрый поиск</h3>
            <input autoFocus placeholder="Введите название документа" value={query} onChange={e=>setQuery(e.target.value)} style={{width:'100%', padding:'10px 12px', borderRadius:10, border:'1px solid #1b1f27', background:'#12161c', color:'#e7e7e7'}} />
            <div style={{marginTop:12, maxHeight:'60vh', overflow:'auto', display:'grid', gap:8}}>
              {filtered.slice(0,50).map(l => (
                <button key={l.id} onClick={()=>{ setSearchOpen(false); onOpen(l); }} style={{textAlign:'left', border:'1px solid #1b1f27', borderRadius:12, padding:12, background:'#12161c', color:'#e7e7e7'}}>
                  {l.title}
                </button>
              ))}
            </div>
            <div style={{textAlign:'right', marginTop:10}}>
              <button onClick={()=>setSearchOpen(false)} style={{background:'#0b6b3a', color:'#fff', border:'none', borderRadius:10, padding:'8px 12px'}}>Готово</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
