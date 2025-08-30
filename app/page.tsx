'use client';

import { useEffect } from 'react';

export default function Home(){
  useEffect(()=>{
    try{
      const w:any = window;
      w?.Telegram?.WebApp?.ready?.();
      w?.Telegram?.WebApp?.expand?.();
    }catch{}
  },[]);

  return (
    <main>
      <div className="safe" style={{maxWidth:560, margin:'0 auto', textAlign:'center'}}>
        <h1 style={{fontWeight:700, fontSize:24, marginBottom:8}}>Юристум</h1>
        <p style={{opacity:.85}}>Юридический помощник. Дела, документы, подписка.</p>

        <div style={{marginTop:24, display:'grid', gap:8, justifyItems:'center'}}>
          <a className="btn btn-secondary" href="/legal">Правовая информация</a>
          <a className="btn btn-secondary" href="/terms">Условия подписки</a>
        </div>
      </div>
    </main>
  );
}
