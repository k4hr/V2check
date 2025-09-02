'use client';

import { useEffect, useState } from 'react';

type Fav = {
  id: string;
  title: string;
  url?: string | null;
  note?: string | null;
  createdAt: string;
};

export default function FavoritesPage(){
  const [items, setItems] = useState<Fav[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const w:any = window;
      const initData = w?.Telegram?.WebApp?.initData || '';
      const resp = await fetch('/api/favorites', { headers: { 'x-init-data': initData } });
      const data = await resp.json();
      if (!resp.ok || !data?.ok) throw new Error(data?.error || 'load error');
      setItems(data.items || []);
    } catch(e:any) {
      setErr(e?.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }

  async function remove(id:string){
    try {
      const w:any = window;
      const initData = w?.Telegram?.WebApp?.initData || '';
      const resp = await fetch(`/api/favorites?id=${encodeURIComponent(id)}`, {
        method:'DELETE',
        headers: { 'x-init-data': initData }
      });
      const data = await resp.json();
      if (!resp.ok || !data?.ok) throw new Error(data?.error || 'delete error');
      setItems(prev => prev.filter(x => x.id !== id));
    } catch(e:any){
      alert(e?.message || 'Не удалось удалить');
    }
  }

  useEffect(() => {
    const w:any = window;
    w?.Telegram?.WebApp?.ready?.();
    w?.Telegram?.WebApp?.expand?.();
    load();
  }, []);

  return (
    <main style={{padding:20}}>
      <h1 style={{textAlign:'center'}}>Избранное</h1>

      {loading && <p>Загружаем…</p>}
      {err && <p style={{color:'#f66'}}>{err}</p>}

      {(!loading && !err && items.length === 0) && (
        <p style={{textAlign:'center', opacity:.7}}>Пока пусто.</p>
      )}

      <div style={{display:'grid', gap:10, marginTop:10}}>
        {items.map(item => (
          <div key={item.id} className="list-btn" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div className="list-btn__left" style={{minWidth:0}}>
              <span className="list-btn__emoji">⭐</span>
              <b style={{wordBreak:'break-word'}}>{item.title}</b>
            </div>
            <div className="list-btn__right" style={{display:'flex', gap:8, alignItems:'center'}}>
              {item.url && <a href={item.url} className="list-btn__chev" style={{textDecoration:'underline'}}>ссылка</a>}
              <button onClick={() => remove(item.id)} className="list-btn__chev" style={{cursor:'pointer'}}>×</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
