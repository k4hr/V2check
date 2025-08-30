'use client';

import { useEffect, useState } from 'react';
import { PRICES, type Plan } from '../lib/pricing';

export default function ProPage(){
  const [buying, setBuying] = useState<Plan | null>(null);

  useEffect(()=>{
    try{
      const w:any = window;
      w?.Telegram?.WebApp?.ready?.();
      w?.Telegram?.WebApp?.expand?.();
    }catch{}
  },[]);

  async function buy(plan: Plan){
    if (buying) return;
    setBuying(plan);
    try{
      const res = await fetch('/api/createInvoice', {
        method: 'POST',
        headers: { 'content-type':'application/json' },
        body: JSON.stringify({ plan })
      });
      const data = await res.json();
      if (!data?.ok || !data?.link) throw new Error(data?.error || 'Не удалось создать счёт');
      const tg:any = (window as any).Telegram?.WebApp;
      if (tg?.openInvoice) {
        tg.openInvoice(data.link, (status:string)=>{
          // status: "paid" | "cancelled" | "failed" | "pending"
        });
      } else {
        // fallback
        window.open(data.link, '_blank');
      }
    }catch(e){ console.error(e); }
    finally{ setBuying(null); }
  }

  return (
    <main>
      <div className="safe" style={{maxWidth:560, margin:'0 auto'}}>
        <h1 style={{fontFamily:'var(--font-serif, inherit)', fontWeight:700, fontSize:28, marginBottom:8}}>Juristum Pro</h1>
        <p style={{opacity:.85, marginBottom:16}}>Выберите тариф — окно Telegram-оплаты откроется сразу.</p>

        <div style={{display:'grid', gap:12}}>
          {(['WEEK','MONTH','HALF','YEAR'] as Plan[]).map((p)=>{
            const cfg = PRICES[p];
            return (
              <button
                key={p}
                onClick={()=>buy(p)}
                className="list-btn"
                disabled={!!buying}
                aria-label={`Купить: ${cfg.label}`}
              >
                <span className="list-btn__left">
                  <span className="list-btn__emoji">⭐</span>
                  <b>{cfg.label}</b>
                </span>
                <span className="list-btn__right">
                  <span>{cfg.amount} ⭐</span>
                  <span className="list-btn__chev">›</span>
                </span>
              </button>
            );
          })}
        </div>

        <p className="text-xs opacity-60" style={{marginTop:24}}>
          Подтверждая, вы соглашаетесь с условиями подписки.
        </p>
      </div>
    </main>
  );
}
