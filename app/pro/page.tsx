'use client';

import { useEffect, useRef, useState } from 'react';
import { PRICES, type Plan } from '../lib/pricing';

export default function ProPage(){
  const [busy, setBusy] = useState<Plan | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [lastLink, setLastLink] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

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
    setLastLink(null);
    setHint(null);
    try{
      const res = await fetch(`/api/createInvoice?plan=${encodeURIComponent(plan)}`, { method: 'POST' });
      const data = await res.json().catch(()=>null);
      if (!data?.ok || !data?.link){
        throw new Error(data?.error || data?.detail?.description || 'Ошибка создания счёта');
      }
      const link = String(data.link);
      setLastLink(link);

      const tg:any = (window as any).Telegram?.WebApp;

      // таймаут, чтобы не зависнуть без реакции
      let opened = false;
      const timer = setTimeout(()=>{
        if (!opened){
          setHint('Нажмите «Открыть оплату», если окно не появилось автоматически.');
        }
      }, 1200);

      if (tg?.openInvoice){
        tg.openInvoice(link, (status:string)=>{
          opened = true;
          clearTimeout(timer);
          // Возможные статусы: paid | cancelled | failed | pending
          if (status && status !== 'paid'){
            setMsg(`Статус: ${status}`);
          }
        });
      } else if (tg?.openTelegramLink){
        opened = true;
        clearTimeout(timer);
        tg.openTelegramLink(link);
      } else {
        opened = true;
        clearTimeout(timer);
        window.location.href = link; // самый совместимый фолбэк
      }
    }catch(e:any){
      setMsg(e?.message || 'Неизвестная ошибка');
    }finally{
      setBusy(null);
    }
  }

  return (
    <main>
      <div className="safe" style={{maxWidth:560, margin:'0 auto'}}>
        <h1 style={{fontFamily:'var(--font-serif, inherit)', fontWeight:700, fontSize:28, marginBottom:8}}>Juristum Pro</h1>
        <p style={{opacity:.85, marginBottom:16}}>Выберите тариф — окно Telegram-оплаты откроется сразу.</p>

        {(msg || hint) && (
          <div className="card" role="alert" style={{marginBottom:12, borderColor:'rgba(255,180,0,.35)'}}>
            {msg && <><b>Не получилось открыть оплату.</b><br/><span style={{opacity:.85}}>{msg}</span></>}
            {hint && !msg && <span style={{opacity:.9}}>{hint}</span>}
            {lastLink && !msg && (
              <div style={{marginTop:10}}>
                <a className="btn" href={lastLink} target="_blank" rel="noreferrer">Открыть оплату</a>
              </div>
            )}
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
