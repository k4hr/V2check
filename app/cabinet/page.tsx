'use client';

import { useEffect, useState } from 'react';
import { getTg } from '../lib/tma';
import Link from 'next/link';

type User = {
  id: string;
  telegramId: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  photoUrl?: string | null;
  plan?: string | null;
  expiresAt?: string | null;
};

export default function Cabinet(){
  const [user, setUser] = useState<User | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tg = getTg();
    try{ tg?.BackButton?.show?.(); tg?.BackButton?.onClick?.(()=>history.back()); }catch{}
    // Verify on mount
    const initData = (window as any)?.Telegram?.WebApp?.initData;
    fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData })
    }).then(r => r.json()).then((data) => {
      if (!data?.ok) throw new Error(data?.error || 'Auth failed');
      setUser(data.user);
    }).catch((e:any)=>{ setErr(e?.message || 'Ошибка'); }).finally(()=> setLoading(false));
  }, []);

  const initials = (u:User) => (u.firstName?.[0] || u.username?.[0] || 'U').toUpperCase();

  return (
    <main>
      <div className="safe" style={{maxWidth:560, margin:'0 auto'}}>
        <h1 style={{fontWeight:700, fontSize:22, marginBottom:12, textAlign:'center'}}>Личный кабинет</h1>

        {loading && <div className="card">Вход через Telegram…</div>}
        {err && <div className="card" role="alert">Ошибка: {err}</div>}

        {user && (
          <div className="card" style={{display:'grid', gridTemplateColumns:'56px 1fr', gap:12, alignItems:'center'}}>
            <div style={{width:56, height:56, borderRadius:12, background:'var(--panel)', display:'grid', placeItems:'center', fontWeight:700}}>
              {user.photoUrl ? <img src={user.photoUrl} alt="avatar" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:12}}/> : initials(user)}
            </div>
            <div>
              <div style={{fontWeight:700}}>{user.firstName || user.username || 'Пользователь'}</div>
              <div className="muted" style={{fontSize:12}}>@{user.username || 'unknown'} · ID {user.telegramId}</div>
            </div>
          </div>
        )}

        <div className="card">
          <h2 style={{margin:'0 0 6px'}}>Статус подписки</h2>
          <div className="muted" style={{marginBottom:8}}>Данные подписки появятся после первой покупки.</div>
          <Link href="/pro" className="btn" style={{display:'inline-block'}}>Оформить или продлить</Link>
        </div>
      </div>
    </main>
  );
}
