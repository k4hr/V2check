'use client';
import React, { useEffect, useState } from 'react';
import TopBar from '../components/TopBar';
import LockBadge from '../components/LockBadge';
import { isPro } from '../lib/subscription';
import { canOpen, remaining, registerOpen } from '../lib/freeReads';
import { isFav, toggleFav } from '../lib/favorites';

type Law = { id: string; title: string; updated_at: string };

export default function Library(): JSX.Element {
  const [laws, setLaws] = useState<Law[]>([]);
  const [pro, setPro] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [rem, setRem] = useState<number>(2);
  const [favIds, setFavIds] = useState<string[]>([]);

  const refreshFavs = (): void => {
    try {
      const raw = localStorage.getItem('favorites') || '[]';
      setFavIds(JSON.parse(raw));
    } catch { setFavIds([]); }
  };

  useEffect(() => {
    (async () => {
      try {
        const WebApp = (await import('@twa-dev/sdk')).default;
        WebApp?.ready?.(); WebApp?.expand?.();
      } catch {}
      fetch('/content/index.json')
        .then(r => r.json())
        .then((data: Law[]) => setLaws(data))
        .catch(() => setErr('Не удалось загрузить список'));
      const p = isPro(); setPro(p); setRem(remaining(p)); refreshFavs();
    })();
  }, []);

  const onOpen = (law: Law): void => {
    const p = isPro();
    if (!canOpen(law.id, p)) { window.location.href = '/pro'; return; }
    registerOpen(law.id, p);
    window.location.href = `/content/laws/${law.id}.html`;
  };

  const onFav = (e: React.MouseEvent<HTMLButtonElement>, id: string): void => {
    e.stopPropagation();
    toggleFav(id); refreshFavs();
  };

  return (
    <main>
      <TopBar />
      <div style={{padding:16}}>
        <h1 style={{fontSize:22, fontWeight:700, marginBottom:6}}>📚 Библиотека</h1>
        {!pro && <div style={{opacity:.8,fontSize:13,marginBottom:12}}>Сегодня бесплатно: {rem} чтения(й). Для безлимита оформите <a href="/pro" style={{color:'#8ab4ff'}}>Pro</a>.</div>}
        {err && <div>{err}</div>}
        <ul style={{display:'grid', gap:12, listStyle:'none', padding:0}}>
          {laws.map((law) => {
            const locked = !isPro() && !canOpen(law.id, false);
            const fav = isFav(law.id);
            return (
              <li key={law.id} style={{border:'1px solid #2b2f39', borderRadius:12, padding:14, background:'#111319'}} onClick={()=>onOpen(law)}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div style={{fontWeight:600}}>{law.title}</div>
                  <LockBadge locked={locked} />
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center', marginTop:6}}>
                  <div style={{fontSize:12, opacity:.7}}>обновлено {law.updated_at}</div>
                  <button onClick={(e)=>onFav(e, law.id)} style={{background:'transparent', color:'#e7e7e7', border:'1px solid #2b2f39', borderRadius:8, padding:'4px 8px'}}>
                    {fav ? '★ Удалить' : '☆ В избранное'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
