/* path: app/cabinet/admin/metrics/page.tsx */
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Gift = { id: string; title?: string; star_count?: number };

function haptic(type: 'light' | 'medium' = 'light') {
  try { (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type); } catch {}
}

function ThemeCSS(){
  return (
    <style jsx global>{`
      :root{
        --bg:#f7f9ff; --fg:#0f172a; --panel:#ffffff; --panel-weak:#f2f6ff; --border:rgba(15,23,42,.14); --accent:#4c82ff;
      }
      body{ background: var(--bg); color: var(--fg); }
      .list-btn{
        display:flex; align-items:center; justify-content:space-between; gap:10px;
        padding:12px 14px; border-radius:12px;
        background:var(--panel); color:var(--fg);
        border:1px solid var(--border); font-weight:800;
      }
      .btn-accent{
        background: color-mix(in oklab, var(--accent) 18%, var(--panel));
        border: 1px solid color-mix(in oklab, var(--accent) 60%, var(--border));
      }
      .section{
        background: color-mix(in oklab, var(--panel) 86%, transparent);
        border: 1px solid var(--border);
        box-shadow: inset 0 0 0 1px rgba(255,255,255,.04);
        border-radius:16px; padding:14px;
      }
      input, select, textarea{
        color:var(--fg);
        background:var(--panel);
        border:1px solid var(--border);
      }
      .muted{ opacity:.85 }
    `}</style>
  );
}

export default function AdminMetricsPage() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loadingGifts, setLoadingGifts] = useState(false);
  const [giftId, setGiftId] = useState('');
  const [channelsStr, setChannelsStr] = useState('');
  const [text, setText] = useState('🎁 Каждому по подарку!');
  const [sending, setSending] = useState(false);
  const [log, setLog] = useState('');

  function appendLog(line: string) { setLog(prev => (prev ? prev + '\n' : '') + line); }

  useEffect(() => {
    (async () => {
      try {
        setLoadingGifts(true);
        const initData = (window as any)?.Telegram?.WebApp?.initData || '';
        const r = await fetch('/api/admin/gifts/list', {
          method: 'GET',
          headers: initData ? { 'x-init-data': initData } : {},
          cache: 'no-store',
        });
        const j = await r.json();
        if (!r.ok || !j?.ok) throw new Error(j?.error || 'GIFT_LIST_FAILED');

        const list: Gift[] = j.gifts || [];
        setGifts(list);

        let preferred = list.find(g => Number(g.star_count) === 15)?.id;
        if (!preferred && list.length) preferred = list[0].id;
        if (preferred) setGiftId(preferred);
      } catch (e: any) {
        appendLog('Ошибка загрузки подарков: ' + String(e?.message || e));
      } finally {
        setLoadingGifts(false);
      }
    })();
  }, []);

  async function send() {
    if (!giftId || !channelsStr.trim() || sending) return;
    setSending(true); setLog('');
    try {
      const channels = channelsStr.split(',').map(s => s.trim()).filter(Boolean);
      const initData = (window as any)?.Telegram?.WebApp?.initData || '';
      const r = await fetch('/api/admin/gifts/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(initData ? { 'x-init-data': initData } : {}) },
        body: JSON.stringify({ gift_id: giftId, channels, text }),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || 'SEND_FAILED');

      for (const row of (j.results || [])) {
        if (row.ok) appendLog(`✅ ${row.chat_id} → отправлено (message_id: ${row.message_id ?? '-'})`);
        else appendLog(`❌ ${row.chat_id} → ${row.error || 'error'}`);
      }
      haptic('medium');
    } catch (e: any) {
      appendLog('Фатальная ошибка: ' + String(e?.message || e));
    } finally {
      setSending(false);
    }
  }

  // Кнопка «Скачать за всё время (TXT)» — с заголовком x-init-data
  function downloadAllTimeTxt() {
    const initData = (window as any)?.Telegram?.WebApp?.initData || '';
    (async () => {
      try {
        const r = await fetch('/api/admin/export/users?format=txt', {
          method: 'GET',
          headers: initData ? { 'x-init-data': initData } : {},
          cache: 'no-store',
        });
        if (!r.ok) {
          const j = await r.json().catch(() => ({} as any));
          throw new Error(j?.error || `HTTP ${r.status}`);
        }
        const txt = await r.text();
        const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'users-all.txt';
        document.body.appendChild(a); a.click();
        URL.revokeObjectURL(url); a.remove();
        haptic('medium');
      } catch (e:any) {
        alert('Не удалось скачать: ' + String(e?.message || e));
      }
    })();
  }

  return (
    <main className="safe" style={{ padding: 20, display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Link href="/cabinet/admin" className="list-btn" onClick={() => haptic('light')} style={{ width: 120, textDecoration: 'none' }}>
          ← Назад
        </Link>
        <h1 style={{ margin: 0 }}>Admin · Метрики</h1>
      </div>

      <p className="muted">Заглушка раздела. Здесь будут графики: DAU/MAU, конверсии в подписку, удержание, лимиты и пр.</p>

      {/* Подарки */}
      <section className="section">
        <h3 style={{ margin: 0 }}>Подарки</h3>

        <label style={{ display: 'grid', gap: 6 }}>
          <span className="muted">ID канала(ов) — через запятую</span>
          <input
            value={channelsStr}
            onChange={e => setChannelsStr(e.target.value)}
            placeholder="@AlfaBank,@yourChannel,-1001234567890"
            style={{ height: 38, borderRadius: 10, padding: '0 10px' }}
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span className="muted">Подарок</span>
          <select
            value={giftId}
            onChange={e => setGiftId(e.target.value)}
            disabled={loadingGifts || !gifts.length}
            style={{ height: 38, borderRadius: 10, padding: '0 10px' }}
          >
            {loadingGifts && <option>Загрузка…</option>}
            {!loadingGifts && gifts.map(g => (
              <option key={g.id} value={g.id}>
                {(g.title || 'Подарок')} — {Number(g.star_count) || '?'}⭐
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span className="muted">Сообщение (опционально)</span>
          <textarea
            rows={3}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="🎁 Каждому по подарку!"
            style={{ borderRadius: 10, padding: '8px 10px' }}
          />
        </label>

        <button
          type="button"
          onClick={() => { haptic('light'); send(); }}
          disabled={!giftId || !channelsStr.trim() || sending}
          className="list-btn btn-accent"
          style={{ borderRadius: 12 }}
        >
          {sending ? 'Отправляем…' : 'Отправить'}
        </button>

        <pre
          style={{
            whiteSpace: 'pre-wrap',
            margin: 0,
            padding: 10,
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'var(--panel-weak)',
            fontSize: 12,
            lineHeight: 1.35,
            maxHeight: 260,
            overflow: 'auto'
          }}
        >{log || 'Лог появится здесь…'}</pre>

        <small className="muted">
          Список — <code>getAvailableGifts</code>, отправка — <code>sendGift</code>. Нужен <b>BOT_TOKEN</b> на сервере.
        </small>
      </section>

      {/* Только кнопка «скачать за всё время» */}
      <div style={{ display:'flex', justifyContent:'center' }}>
        <button
          type="button"
          className="list-btn"
          onClick={downloadAllTimeTxt}
          style={{ borderRadius: 12, maxWidth: 320 }}
        >
          Скачать за всё время (TXT)
        </button>
      </div>

      <ThemeCSS/>
    </main>
  );
}
