'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';

export default function BusinessPlanHub(){
  useEffect(()=>{ const w:any=window; w?.Telegram?.WebApp?.ready?.(); w?.Telegram?.WebApp?.expand?.(); },[]);
  const linkSuffix = useMemo(()=>{ try{ const u=new URL(window.location.href); const id=u.searchParams.get('id'); return id?`?id=${encodeURIComponent(id)}`:'';}catch{ return '';}},[]);
  const href=(p:string)=> `${p}${linkSuffix}`;

  return (
    <main style={{padding:20,maxWidth:720,margin:'0 auto'}}>
      <button type="button" onClick={()=>history.length>1?history.back():location.assign('/home/pro-plus')} className="list-btn" style={{maxWidth:120,marginBottom:12}}>← Назад</button>
      <h1 style={{textAlign:'center'}}>Бизнес-план Pro+</h1>
      <p style={{textAlign:'center',opacity:.7,marginTop:6}}>Выберите режим: запуск или анализ/продвижение.</p>

      <div style={{display:'grid',gap:12,marginTop:16}}>
        <Link href={href('/home/pro-plus/businesschat/launch')} className="list-btn" style={{textDecoration:'none'}}>
          <span className="list-btn__left"><span className="list-btn__emoji">🚀</span><b>Запуск — стратегический чат</b></span>
          <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
        </Link>

        <Link href={href('/home/pro-plus/businesschat/analysis')} className="list-btn" style={{textDecoration:'none'}}>
          <span className="list-btn__left"><span className="list-btn__emoji">📈</span><b>Анализ — рынок / УТП / лендинг / контент / лиды</b></span>
          <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
        </Link>
      </div>
    </main>
  );
}
