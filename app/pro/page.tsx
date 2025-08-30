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
      // Используем безопасный GET с параметром, чтобы исключить проблемы с body на проде
      const res = await fetch(`/api/createInvoice?plan=${encodeURIComponent(plan)}`, { method: 'POST' });
      // некоторые прокси на Railway игнорируют body в edge — поэтому на сервере мы тоже читаем query
      const data = await res.json().catch(()=>null);
      if (!data?.ok || !data?.link){
        throw new Error(data?.error || 'Ошибка создания счёта');
      }

      const tg:any = (window as any).Telegram?.WebApp;
      if (tg?.openInvoice){
        tg.openInvoice(data.link, (status:string)=>{
          // status: "paid" | "pending" | "cancelled" | "failed"
          // Можно дополнить обработку, если нужно
        });
      } else {
        // Фолбэк, если метод недоступен (запуск вне Telegram)
        window.open(data.link, '_blank');
      }
    }catch(e:any){
      console.error(e);
      setMsg(e?.message || 'Неизвестная ошибка');
    }finally{
      setBusy(null);
      // автоочистка сообщения через 4 сек
      setTimeout(()=>setMsg(null), 4000);
    }
  }

  return (
    <main>
      <div className="safe" style={{maxWidth:560, margin:'0 auto'}}>
        <h1 style={{fontFamily:'var(--font-serif, inherit)', fontWeight:700, fontSize:28, marginBottom:8}}>Juristum Pro</h1>
        <p style={{opacity:.85, marginBottom:16}}>Выберите тариф — окно Telegram-оплаты откроется сразу.</p>

        {msg && (
          <div className="card" role="alert" style={{marginBottom:12, borderColor:'rgba(255,180,0,.35)'}}>
            <b>Не получилось открыть оплату.</b><br/>
            <span style={{opacity:.85}}>{msg}</span>
          </div>
        )}

        <div style={{display:'grid', gap:12}}>
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

        <p className="text-xs opacity-60" style={{marginTop:24}}>
          Подтверждая, вы соглашаетесь с условиями подписки.
        </p>
      </div>
    </main>
  );
}
