'use client';
import { useEffect, useState } from 'react';
import TopBar from '../components/TopBar';
import { getSub, isPro } from '../lib/subscription';
import { getFavs } from '../lib/favorites';

const RECO = ['Гражданский кодекс РФ','Уголовный кодекс РФ','КоАП РФ','Налоговый кодекс РФ'];

function daysLeft(ts:number){ const diff = ts - Date.now(); return Math.max(0, Math.ceil(diff/(24*60*60*1000))); }

export default function Cabinet(){
  const [pro,setPro]=useState(false);
  const [until,setUntil]=useState(0);
  const [favs,setFavs]=useState<string[]>([]);

  useEffect(()=>{
    setPro(isPro());
    const s=getSub(); setUntil(s.expiresAt);
    setFavs(getFavs());
  },[]);

  const left = daysLeft(until);

  return (
    <main>
      <TopBar />
      <div style={{padding:16}} className="grid">
        <div className="card">
          <h1 style={{margin:'0 0 6px'}}>👤 Личный кабинет</h1>
          {pro ? (
            <div>Статус: <b>Pro активно</b> — осталось {left} дн.<br/><span className="muted">до {new Date(until).toLocaleString()}</span></div>
          ) : (
            <div>Статус: <b>Бесплатный доступ</b> — 2 документа/день. <a href="/pro" style={{color:'#8ab4ff'}}>Оформить Pro</a></div>
          )}
          {!pro && <div className="card" style={{marginTop:12}}>
            <b>Напоминание:</b> Оформите Pro, чтобы читать без ограничений.
            <div style={{marginTop:8}}><a className="btn primary" href="/pro">Купить подписку</a></div>
          </div>}
        </div>

        <div className="card">
          <h2 style={{margin:'0 0 6px'}}>★ Избранное</h2>
          {favs.length===0 ? <div className="muted">Пусто. Добавляйте документы через кнопку ☆.</div> :
            <div className="grid">{favs.map(id=>(<a key={id} className="btn" href={`/content/laws/${id}.html`}>{id}</a>))}</div>}
        </div>

        <div className="card">
          <h2 style={{margin:'0 0 6px'}}>Рекомендации</h2>
          <div className="grid cols2">
            {RECO.map((t,i)=>(<div key={i} className="btn">{t}</div>))}
          </div>
        </div>
      </div>
    </main>
  );
}
