'use client';
import { useEffect, useState } from 'react';
import TopBar from '../components/TopBar';
import { isPro, applyPlan } from '../lib/subscription';

type PlanBtn = { label:string; plan:'WEEK'|'MONTH'|'HALF'|'YEAR'; stars:number; days:number };

const plans:PlanBtn[] = [
  { label:'Неделя', plan:'WEEK', stars:100, days:7 },
  { label:'Месяц', plan:'MONTH', stars:300, days:30 },
  { label:'Полгода', plan:'HALF', stars:1200, days:182 },
  { label:'Год', plan:'YEAR', stars:2000, days:365 },
];

export default function ProPage(){
  const [active,setActive]=useState(false);
  useEffect(()=>{ setActive(isPro()); },[]);

  const buy= async (p:PlanBtn)=>{
    try{
      const res = await fetch(`/api/createInvoice?plan=${p.plan}`, {method:'POST'});
      const data = await res.json();
      if(!data.ok){ alert('Не удалось создать счёт.'); return; }
      const WebApp = (await import('@twa-dev/sdk')).default;
      WebApp.onEvent('invoiceClosed', (e:any)=>{
        if (e.status==='paid'){ applyPlan(p.plan); alert('Оплата прошла. Pro активирована.'); location.href='/'; }
        else if (e.status==='failed'){ alert('Оплата не прошла.'); }
      });
      WebApp.openInvoice(data.link);
    }catch{ alert('Ошибка оплаты.'); }
  };

  return (
    <main>
      <TopBar />
      <div style={{padding:16}} className="grid">
        <div className="card">
          <h1 style={{margin:'0 0 6px'}}>⭐ Juristum Pro</h1>
          {active && <div className="muted">Pro уже активна. Можно продлить срок.</div>}
        </div>
        <div className="grid">
          {plans.map(p=>(
            <button key={p.plan} className="btn primary" onClick={()=>buy(p)}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div><b>{p.label}</b> — {p.stars} ⭐</div>
                <div style={{opacity:.9,fontSize:12}}>{p.days} дней</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
