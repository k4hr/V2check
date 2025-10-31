'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function PayReturnPage(){
  const [msg,setMsg] = useState('Идёт подтверждение оплаты…');

  useEffect(() => {
    // Мягкая стратегия: просто подождать чуть-чуть, чтобы вебхук успел
    const t = setTimeout(() => setMsg('Если подписка ещё не обновилась, откройте Личный кабинет — статус подтянется автоматически.'), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <main style={{maxWidth:640, margin:'0 auto', padding:20}}>
      <h1 style={{textAlign:'center'}}>Возврат из оплаты</h1>
      <p style={{textAlign:'center', opacity:.9}}>{msg}</p>
      <div style={{display:'flex', justifyContent:'center', gap:10}}>
        <Link href="/cabinet" className="list-btn" style={{textDecoration:'none', padding:'10px 14px', borderRadius:12, border:'1px solid var(--border)'}}>Личный кабинет</Link>
        <Link href="/home" className="list-btn" style={{textDecoration:'none', padding:'10px 14px', borderRadius:12, border:'1px solid var(--border)'}}>На главную</Link>
      </div>
    </main>
  );
}
