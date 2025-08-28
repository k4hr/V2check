'use client';
import { useEffect, useState } from 'react';
import TopBar from '../components/TopBar';
import { getSub, isPro } from '../lib/subscription';
import { getFavs } from '../lib/favorites';

export default function Cabinet(){
  const [pro,setPro]=useState(false);
  const [until,setUntil]=useState<number>(0);
  const [favs,setFavs]=useState<string[]>([]);

  useEffect(()=>{
    setPro(isPro());
    setUntil(getSub().expiresAt);
    setFavs(getFavs());
  },[]);

  return (
    <main>
      <TopBar />
      <div style={{padding:16}}>
        <h1 style={{fontSize:22,fontWeight:700,marginBottom:8}}>👤 Личный кабинет</h1>
        {pro ? (
          <div style={{marginBottom:12}}>Статус: <b>Pro активно</b><br/>Действует до: {new Date(until).toLocaleString()}</div>
        ) : (
          <div style={{marginBottom:12}}>Статус: <b>Бесплатный доступ</b> — 2 статьи в день. <a href="/pro" style={{color:'#8ab4ff'}}>Оформить Pro</a></div>
        )}
        <h2 style={{fontSize:18,margin:'16px 0 8px'}}>★ Избранное</h2>
        {favs.length===0 ? <div style={{opacity:.8}}>Пока пусто. Добавляйте статьи из «Библиотека».</div> :
          <ul style={{listStyle:'none',padding:0}}>
            {favs.map(id=>(<li key={id} style={{margin:'6px 0'}}><a href={`/content/laws/${id}.html`} style={{color:'#8ab4ff'}}>{id}</a></li>))}
          </ul>
        }
      </div>
    </main>
  );
}
