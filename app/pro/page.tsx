'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { PRICES, type Plan } from '../lib/pricing';

export default function ProPage(){
  const [busy, setBusy] = useState<Plan | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(()=>{
    try{
      const w:any = window;
      const tg = w?.Telegram?.WebApp;
      tg?.ready?.();
      tg?.expand?.();
      // Встроенная кнопка "Назад" в шапке Telegram
      tg?.BackButton?.show?.();
      tg?.BackButton?.onClick?.(()=>{
        if (document.referrer) history.back();
        else window.location.href = '/';
      });
      return () => tg?.BackButton?.hide?.();
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
      <div className="safe" style={{maxWidth:560, margin:'0 auto', display:'flex', flexDirection:'column', minHeight:'calc(100dvh - 32px)'}}>
        <div style={{textAlign:'center'}}>
          <h1 style={{fontFamily:'var(--font-serif, inherit)', fontWeight:700, fontSize:28, marginBottom:8}}>Juristum Pro</h1>
          <p style={{opacity:.85, marginBottom:20}}>Выберите тариф:</p>
        </div>

        {msg && (
          <div className="card" role="alert" style={{marginBottom:12, borderColor:'rgba(255,180,0,.35)'}}>
            <b>Не получилось открыть оплату.</b><br/>
            <span style={{opacity:.85}}>{msg}</span>
          </div>
        )}

        <div style={{display:'grid', gap:12}}>
          {(['WEEK','MONTH','HALF','YEAR'] as Plan[]).map((p)=>{
            const cfg = PRICES[p];
            // вычислим бейджи
            let badge: JSX.Element | null = null;
            if (p === 'MONTH') {
              badge = <span className="badge badge--pop">Самый популярный</span>;
            } else if (p === 'HALF') {
              const base = PRICES.MONTH.amount * 6;
              const save = Math.max(0, Math.round((1 - cfg.amount / base) * 100));
              badge = <span className="badge badge--save">Экономия {save}%</span>;
            } else if (p === 'YEAR') {
              const base = PRICES.MONTH.amount * 12;
              const save = Math.max(0, Math.round((1 - cfg.amount / base) * 100));
              badge = <span className="badge badge--save">Экономия {save}%</span>;
            }
            return (
              <button
                key={p}
                type="button"
                onClick={()=>buy(p)}
                className="list-btn"
                disabled={!!busy}
                aria-label={`Купить: ${cfg.label}`}
              >
                <span className="list-btn__left" style={{gap:12}}>
                  <span className="list-btn__emoji">⭐</span>
                  <b>{cfg.label}</b>
                  {badge && <span style={{marginLeft:6}}>{badge}</span>}
                </span>
                <span className="list-btn__right">
                  <span>{cfg.amount} ⭐</span>
                  <span className="list-btn__chev">›</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Нижний малозаметный футер */}
        <div style={{marginTop:'auto'}}>
          <p className="text-xs opacity-60" style={{fontSize:12, opacity:.55, textAlign:'center', marginTop:24}}>
            Подтверждая, вы соглашаетесь с <a href="/terms" style={{textDecoration:'underline'}}>условиями подписки</a>.
          </p>
          <p className="text-xs opacity-60" style={{fontSize:12, opacity:.55, textAlign:'center'}}>
            Также ознакомьтесь с <a href="/legal" style={{textDecoration:'underline'}}>правовой информацией</a>.
          </p>
        </div>
      </div>
    </main>
  );
}
