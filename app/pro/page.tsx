'use client';

import { useEffect, useState } from 'react';
import { PRICES, type Plan } from '../lib/pricing';

export default function ProPage(){
  const [busy, setBusy] = useState<Plan | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(()=>{
    try{
      const w:any = window;
      w?.Telegram?.WebApp?.ready?.();
      w?.Telegram?.WebApp?.expand?.();
    }catch{}
  },[]);

  async function buy(plan: Plan){
    if (busy) return;
    setBusy(plan);
    setMsg(null);
    try{
      const res = await fetch(`/api/createInvoice?plan=${encodeURIComponent(plan)}`, { method: 'POST' });
      const data = await res.json().catch(()=>null);
      if (!data?.ok || !data?.link){
        throw new Error(data?.error || data?.detail?.description || 'Ошибка создания счёта');
      }
      const link = String(data.link);
      const tg:any = (window as any).Telegram?.WebApp;
      if (tg?.openInvoice){
        tg.openInvoice(link, ()=>{});
      } else if (tg?.openTelegramLink){
        tg.openTelegramLink(link);
      } else {
        window.location.href = link;
      }
    }catch(e:any){
      setMsg(e?.message || 'Неизвестная ошибка');
    }finally{
      setBusy(null);
    }
  }

  return (
    <main>
      <div className="safe" style={{maxWidth:560, margin:'0 auto', textAlign:'center'}}>
        <h1 style={{fontFamily:'var(--font-serif, inherit)', fontWeight:700, fontSize:28, marginBottom:8}}>Juristum Pro</h1>
        <p style={{opacity:.85, marginBottom:20}}>Выберите тариф:</p>

        {msg && (
          <div className="card" role="alert" style={{marginBottom:12, borderColor:'rgba(255,180,0,.35)', textAlign:'left'}}>
            <b>Не получилось открыть оплату.</b><br/>
            <span style={{opacity:.85}}>{msg}</span>
          </div>
        )}

        <div style={{display:'grid', gap:12, textAlign:'left'}}>
          {(['WEEK','MONTH','HALF','YEAR'] as Plan[]).map((p)=>{
            const cfg = PRICES[p];
            return (
              <button
                key={p}
                type="button"
                onClick={()=>buy(p)}
                className="list-btn"
                disabled={!!busy}
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

        <p className="text-xs opacity-60" style={{marginTop:32, lineHeight:1.4}}>
          Подтверждая, вы соглашаетесь с <a href="/terms" style={{textDecoration:'underline'}}>условиями подписки</a>.<br/>
          Также ознакомьтесь с <a href="/legal" style={{textDecoration:'underline'}}>правовой информацией</a>.
        </p>
      </div>
    </main>
  );
}
