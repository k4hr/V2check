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
      <div className="safe" style={{maxWidth:560, margin:'0 auto', display:'flex', flexDirection:'column', minHeight:'calc(100dvh - 32px)'}}>
        <div style={{textAlign:'center', marginBottom:24}}>
          <h1 style={{fontWeight:700, fontSize:26, marginBottom:8}}>Юристум ⚖️</h1>
          <p style={{opacity:.85}}>Юридический помощник. Дела, документы, подписка.</p>
        </div>

        <div style={{display:'grid', gap:12}}>
          <Link href="/account" className="list-btn">
            <span className="list-btn__left">
              <span className="list-btn__emoji">👤</span>
              <b>Личный кабинет</b>
            </span>
            <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
          </Link>

          <Link href="/pro" className="list-btn">
            <span className="list-btn__left">
              <span className="list-btn__emoji">⭐</span>
              <b>Купить подписку</b>
            </span>
            <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
          </Link>

          <Link href="/library" className="list-btn">
            <span className="list-btn__left">
              <span className="list-btn__emoji">📖</span>
              <b>Читать бесплатно</b>
            </span>
            <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
          </Link>
        </div>

        {/* Низовой блок со ссылками */}
        <div style={{marginTop:'auto', padding:16, textAlign:'center'}}>
          <p style={{fontSize:12, opacity:.55}}>
            <a href="/legal" style={{textDecoration:'underline'}}>Правовая информация</a>
            {' · '}
            <a href="/terms" style={{textDecoration:'underline'}}>Условия подписки</a>
          </p>
        </div>
      </div>
    </main>
  );
}
