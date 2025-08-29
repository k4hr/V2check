'use client';
import React, { useEffect, useState } from 'react';
import TopBar from '../../components/TopBar';
import { useParams } from 'next/navigation';
import { isFav, toggleFav } from '../../lib/favorites';

type Law = { id:string; title:string; updated_at:string; category:string };

export default function Doc(){
  const params = useParams() as { id: string };
  const id = params?.id as string;
  const [html, setHtml] = useState<string>('');
  const [meta, setMeta] = useState<Law|null>(null);
  const [fav, setFav] = useState<boolean>(false);

  useEffect(()=>{
    fetch('/content/index.json').then(r=>r.json()).then((list:Law[])=>{
      const m = list.find(x=>x.id===id)||null; setMeta(m);
    });
    fetch(`/content/laws/${id}.html`).then(r=>r.text()).then(setHtml).catch(()=>setHtml('<p>Документ не найден</p>'));
    setFav(isFav(id));
  },[id]);

  const onFav = ()=>{ toggleFav(id); setFav(isFav(id)); };

  return (
    <main>
      <TopBar showBack />
      <div style={{padding:16, maxWidth:760, margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center', marginBottom:10}}>
          <div>
            <h1 style={{fontSize:22, fontWeight:800, margin:'0 0 6px'}}>{meta?.title || 'Документ'}</h1>
            {meta && <div style={{fontSize:12, opacity:.75, border:'1px solid #1b1f27', padding:'4px 8px', borderRadius:10, display:'inline-block'}}>{meta.category}</div>}
          </div>
          <button onClick={onFav} style={{background:'#1976d2', color:'#fff', border:'none', borderRadius:10, padding:'8px 12px'}}>{fav ? '★ В избранном' : '☆ В избранное'}</button>
        </div>
        <div style={{border:'1px solid #1b1f27', borderRadius:16, background:'#12161c', padding:16}} dangerouslySetInnerHTML={{__html: html}} />
      </div>
    </main>
  );
}
