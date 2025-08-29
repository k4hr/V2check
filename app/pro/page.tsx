'use client';
import { useEffect, useState } from 'react';
import TopBar from '../components/TopBar';
import { isPro, applyPlan } from '../lib/subscription';

type PlanBtn = { label:string; plan:'WEEK'|'MONTH'|'HALF'|'YEAR'; stars:number; days:number };

const plans:PlanBtn[] = [
  { label:'Неделя',   plan:'WEEK',  stars:29,  days:7   },
  { label:'Месяц',    plan:'MONTH', stars:99,  days:30  },
  { label:'Полгода',  plan:'HALF',  stars:499, days:182 },
  { label:'Год',      plan:'YEAR',  stars:899, days:365 },
];

export default function ProPage(){
  const [active,setActive]=useState(false);
  const [error,setError]=useState<string|null>(null);

  useEffect(()=>{
    setActive(isPro());
    (async()=>{ try{ const WebApp=(await import('@twa-dev/sdk')).default; WebApp?.ready?.(); WebApp?.expand?.(); }catch{} })();
  },[]);

  const buy= async (p:PlanBtn)=>{
    setError(null);
    try{
      const res = await fetch(`/api/createInvoice?plan=${p.plan}`, { method:'POST', cache:'no-store' });
      const data = await res.json();
      if(!data.ok || !data.link){ setError('Не удалось создать счёт.'); return; }
      const WebApp = (await import('@twa-dev/sdk')).default;
      const open = WebApp?.openInvoice ? (link:string)=>WebApp.openInvoice(link) : (link:string)=>window.location.href = link;
      WebApp?.onEvent?.('invoiceClosed', (e:any)=>{
        if (e.status==='paid'){
          applyPlan(p.plan);
          alert('Оплата прошла успешно! Pro активирована.');
          window.location.href='/';
        } else if (e.status==='failed'){
          alert('Оплата не прошла. Попробуйте снова.');
        }
      });
      open(data.link);
    }catch(e){
      setError('Ошибка сети. Попробуйте позже.');
    }
  };

  return (
    <main>
      <TopBar showBack />
      <div style={{padding:16}}>
        <h1 style={{fontSize:22,fontWeight:700,marginBottom:8}}>⭐ Juristum Pro</h1>
        {active && <div style={{marginBottom:12,opacity:.8}}>Pro уже активна. Можно продлить срок.</div>}
        <p style={{opacity:.8,marginBottom:12}}>Безлимитное чтение, без замочков, избранное и заметки.</p>
        {error && <div style={{marginBottom:12, color:'#ff6b6b'}}>{error}</div>}
        <div style={{display:'grid',gap:12}}>
          {plans.map(p=>(
            <button key={p.plan} onClick={()=>buy(p)} style={{padding:16, borderRadius:14, border:'1px solid #1b1f27', background:'#12161c', color:'#e7e7e7', textAlign:'left'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div><b>{p.label}</b> — {p.stars} ⭐</div>
                <div style={{opacity:.8,fontSize:12}}>{p.days} дней</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
