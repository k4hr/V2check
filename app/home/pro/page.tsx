'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function ProHub(){
  useEffect(()=>{ const w:any=window; w?.Telegram?.WebApp?.ready?.(); w?.Telegram?.WebApp?.expand?.(); },[]);
  return (
    <main style={{padding:20,maxWidth:720,margin:'0 auto'}}>
      <button type="button" onClick={()=>history.length>1?history.back():location.assign('/home')} className="list-btn" style={{maxWidth:120,marginBottom:12}}>← Назад</button>
      <h1 style={{textAlign:'center'}}>Ежедневные задачи — Pro</h1>
      <p style={{textAlign:'center',opacity:.7,marginTop:6}}>Хаб инструментов. Наполним блоками по мере готовности.</p>

      <div style={{display:'grid',gap:12,marginTop:16}}>
        <div className="list-btn" style={{opacity:.6,justifyContent:'space-between'}}>
          <span className="list-btn__left"><span className="list-btn__emoji">📝</span><b>Переписать текст</b></span>
          <span className="list-btn__right">Скоро</span>
        </div>
        <div className="list-btn" style={{opacity:.6,justifyContent:'space-between'}}>
          <span className="list-btn__left"><span className="list-btn__emoji">📅</span><b>План на день</b></span>
          <span className="list-btn__right">Скоро</span>
        </div>
        <div className="list-btn" style={{opacity:.6,justifyContent:'space-between'}}>
          <span className="list-btn__left"><span className="list-btn__emoji">🌍</span><b>Переводчик</b></span>
          <span className="list-btn__right">Скоро</span>
        </div>
      </div>
    </main>
  );
}
