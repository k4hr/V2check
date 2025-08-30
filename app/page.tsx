'use client';

import { useEffect } from 'react';
import Link from 'next/link';

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
      <div className="safe" style={{maxWidth:560, margin:'0 auto'}}>
        <div style={{textAlign:'center', marginBottom:24}}>
          <h1 style={{fontWeight:700, fontSize:26, marginBottom:8}}>Juristum ⚖️</h1>
          <p style={{opacity:.85}}>Юридический помощник. Дела, документы, подписка.</p>
        </div>

        <div style={{display:'grid', gap:12}}>
          <Link href="/cabinet" className="list-btn" style={{textDecoration:'none'}}>
            <span className="list-btn__left">
              <span className="list-btn__emoji">👤</span>
              <b>Личный кабинет</b>
            </span>
            <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
          </Link>

          <Link href="/pro" className="list-btn" style={{textDecoration:'none'}}>
            <span className="list-btn__left">
              <span className="list-btn__emoji">⭐</span>
              <b>Купить подписку</b>
            </span>
            <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
          </Link>

          <Link href="/library" className="list-btn" style={{textDecoration:'none'}}>
            <span className="list-btn__left">
              <span className="list-btn__emoji">📖</span>
              <b>Читать бесплатно</b>
            </span>
            <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
          </Link>
        </div>
      </div>
    </main>
  );
}
