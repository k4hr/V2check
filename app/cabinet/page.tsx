'use client';
import React, { useEffect, useMemo, useState } from 'react';
import TopBar from '../components/TopBar';
import { getSub, isPro } from '../lib/subscription';
import { getFavs } from '../lib/favorites';

type Law = { id: string; title: string; updated_at: string; category: string };

const msDay = 24*60*60*1000;
const plural = (n:number, one:string, few:string, many:string) => {
  const m = Math.abs(n) % 100; const n1 = m % 10;
  if (m > 10 && m < 20) return many;
  if (n1 > 1 && n1 < 5) return few;
  if (n1 === 1) return one;
  return many;
};

export default function Cabinet(){
  const [pro,setPro]=useState(false);
  const [until,setUntil]=useState<number>(0);
  const [favIds,setFavIds]=useState<string[]>([]);
  const [laws,setLaws]=useState<Law[]>([]);

  useEffect(()=>{
    setPro(isPro());
    const s = getSub(); setUntil(s.expiresAt||0);
    setFavIds(getFavs());
    fetch('/content/index.json').then(r=>r.json()).then(setLaws).catch(()=>setLaws([]));
  },[]);

  const daysLeft = useMemo(()=>{
    if (!until) return 0;
    const left = Math.ceil((until - Date.now())/msDay);
    return left < 0 ? 0 : left;
  },[until]);

  const favList = favIds.map(id => laws.find(l=>l.id===id)).filter(Boolean) as Law[];

  const recommendations = React.useMemo(()=>{
    const order = (l:Law) => l.category==='codes'?0 : l.category==='constitution'?1 : l.category==='federal'?2 : 3;
    return [...laws].sort((a,b)=> order(a)-order(b)).slice(0,6);
  },[laws]);

  return (
    <main>
      <TopBar showBack />
      <div style={{padding:16, maxWidth:760, margin:'0 auto'}}>
        <h1 style={{fontSize:22,fontWeight:800,marginBottom:8}}>👤 Личный кабинет</h1>

        {pro ? (
          <div style={{marginBottom:12}}>
            <div>Статус: <b>Pro активно</b></div>
            <div>Действует до: {new Date(until).toLocaleString()}</div>
            {daysLeft>0 && daysLeft<=5 && (
              <div style={{marginTop:10, padding:'10px 12px', border:'1px solid #1b1f27', borderRadius:12, background:'#12161c'}}>
                <div style={{marginBottom:6}}>⏳ Подписка заканчивается через <b>{daysLeft}</b> {plural(daysLeft,'день','дня','дней')}.</div>
                <a href="/pro" style={{background:'#1976d2', color:'#fff', textDecoration:'none', padding:'8px 12px', borderRadius:10, display:'inline-block'}}>Продлить Pro</a>
              </div>
            )}
          </div>
        ) : (
          <div style={{marginBottom:12}}>
            Статус: <b>Бесплатный доступ</b> — 2 документа в сутки.
            <div style={{marginTop:8}}><a href="/pro" style={{background:'#1976d2', color:'#fff', textDecoration:'none', padding:'8px 12px', borderRadius:10}}>Оформить Pro</a></div>
          </div>
        )}

        <h2 style={{fontSize:18,margin:'16px 0 8px'}}>★ Избранное</h2>
        {favList.length===0 ? <div style={{opacity:.8}}>Пока пусто. Добавляйте документы в библиотеке.</div> :
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:12}}>
            {favList.map(law => (
              <a key={law.id} href={`/doc/${law.id}`} style={{textDecoration:'none', color:'#e7e7e7'}}>
                <div style={{border:'1px solid #1b1f27', borderRadius:12, padding:12, background:'#12161c'}}>
                  <div style={{fontWeight:700}}>{law.title}</div>
                  <div style={{fontSize:12, opacity:.75, marginTop:4}}>{law.category} • обновлено {law.updated_at}</div>
                </div>
              </a>
            ))}
          </div>
        }

        <h2 style={{fontSize:18,margin:'16px 0 8px'}}>🎯 Рекомендации</h2>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:12}}>
          {recommendations.map(law => (
            <a key={law.id} href={`/doc/${law.id}`} style={{textDecoration:'none', color:'#e7e7e7'}}>
              <div style={{border:'1px solid #1b1f27', borderRadius:12, padding:12, background:'#12161c'}}>
                <div style={{fontWeight:700}}>{law.title}</div>
                <div style={{fontSize:12, opacity:.75, marginTop:4}}>{law.category} • обновлено {law.updated_at}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
