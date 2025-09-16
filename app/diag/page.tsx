'use client';
import React, { useEffect, useState } from 'react';

// Next.js App Router page — must export default component
export default function Page(): JSX.Element {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [rawInit, setRawInit] = useState<string>('');

  useEffect(() => {
    const WebApp: any = (window as any)?.Telegram?.WebApp;
    try { WebApp?.ready?.(); WebApp?.expand?.(); } catch {}
    const initData: string = WebApp?.initData || '';
    setRawInit(initData || '(empty)');
    (async () => {
      try {
        const res = await fetch('/api/_diag', {
          method: 'POST',
          headers: { 'x-init-data': initData || '' }
        });
        const j = await res.json();
        setData(j);
      } catch (e: any) {
        setErr(e?.message || 'fetch failed');
      }
    })();
  }, []);

  return (
    <main style={{padding: 16, color:'#ddd'}}>
      <h1>Диагностика</h1>
      <p style={{opacity:.8}}>initData (сырой):</p>
      <div style={{whiteSpace:'pre-wrap', wordBreak:'break-all',
                  border:'1px solid #333', borderRadius:8, padding:8, marginBottom:12}}>
        {rawInit}
      </div>
      {err && <p style={{color:'crimson'}}>Ошибка: {err}</p>}
      <p style={{opacity:.8}}>Результат /api/_diag:</p>
      <div style={{whiteSpace:'pre-wrap', wordBreak:'break-all',
                  border:'1px solid #333', borderRadius:8, padding:8}}>
        {data ? JSON.stringify(data, null, 2) : 'Загрузка…'}
      </div>
      <div style={{marginTop:16, opacity:.8}}>
        <p>Подсказки:</p>
        <ul>
          <li>Если <b>hmac.valid=false</b> → BOT_TOKEN не совпадает с ботом MiniApp.</li>
          <li>Если <b>webhook.url</b> пуст → не поставлен вебхук через /api/admin/setWebhook.</li>
          <li>Если <b>db.ok=false</b> → проверь DATABASE_URL и миграции.</li>
          <li>Если <b>subscription.active=false</b>, но платёж прошёл → проверь webhook секрет и payload.</li>
        </ul>
      </div>
    </main>
  );
}
