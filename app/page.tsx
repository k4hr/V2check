'use client';
import { useEffect } from 'react';
import TopBar from './components/TopBar';
import BigButton from './components/BigButton';

export default function Home() {
  useEffect(()=>{ (async()=>{ try{ const WebApp=(await import('@twa-dev/sdk')).default; WebApp?.ready?.(); WebApp?.expand?.(); }catch{}})(); },[]);
  return (
    <main>
      <TopBar />
      <div style={{padding:16, display:'grid', gap:12}}>
        <BigButton href="/cabinet" emoji="👤" label="Личный кабинет" />
        <BigButton href="/pro" emoji="⭐" label="Купить подписку" />
        <BigButton href="/library" emoji="📚" label="Библиотека" />
      </div>
    </main>
  );
}
