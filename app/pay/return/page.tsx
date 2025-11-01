'use client';

import React, { useEffect, useState } from 'react';

export default function PayReturnPage() {
  const [text, setText] = useState('Возвращаем вас в приложение…');

  useEffect(() => {
    try {
      const tg: any = (window as any)?.Telegram?.WebApp;
      tg?.ready?.();
      setTimeout(() => {
        // если открыто внутри Telegram — просто закрываем вебвью
        tg?.close?.();
      }, 1200);
    } catch {}
  }, []);

  return (
    <main style={{minHeight:'100dvh',display:'grid',placeItems:'center',padding:24}}>
      <div style={{maxWidth:520, textAlign:'center'}}>
        <h1 style={{marginBottom:8}}>Готово</h1>
        <p style={{opacity:.85, marginTop:0}}>{text}</p>
        <div style={{display:'flex', gap:12, justifyContent:'center', marginTop:16}}>
          <a href="/home" style={{padding:'10px 14px', border:'1px solid #333', borderRadius:12, textDecoration:'none'}}>В кабинет</a>
          <a href="/pro" style={{padding:'10px 14px', border:'1px solid #333', borderRadius:12, textDecoration:'none'}}>К тарифам</a>
        </div>
      </div>
    </main>
  );
}
