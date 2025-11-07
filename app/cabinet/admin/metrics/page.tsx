'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Gift = { id: string; title?: string; star_count?: number };

function haptic(type: 'light' | 'medium' = 'light') {
  try { (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type); } catch {}
}

export default function AdminMetricsPage() {
  // gifts ui state
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loadingGifts, setLoadingGifts] = useState(false);
  const [giftId, setGiftId] = useState('');
  const [channelsStr, setChannelsStr] = useState('');
  const [text, setText] = useState('🎁 Каждому по подарку!');
  const [sending, setSending] = useState(false);
  const [log, setLog] = useState('');

  function appendLog(line: string) {
    setLog(prev => (prev ? prev + '\n' : '') + line);
  }

  // fetch gifts
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

        // автоподстановка сердечка на 15⭐
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
    setSending(true);
    setLog('');
    try {
      const channels = channelsStr
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const initData = (window as any)?.Telegram?.WebApp?.initData || '';
      const r = await fetch('/api/admin/gifts/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(initData ? { 'x-init-data': initData } : {}),
        },
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

  return (
    <main className="safe" style={{ padding: 20, display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Link href="/cabinet/admin" className="list-btn" onClick={() => haptic('light')}
          style={{ width: 120, textDecoration: 'none' }}>
          ← Назад
        </Link>
        <h1 style={{ margin: 0 }}>Admin · Метрики</h1>
      </div>

      <p style={{ opacity: .8 }}>
        Заглушка раздела. Здесь будут графики: DAU/MAU, конверсии в подписку, удержание, лимиты и пр.
      </p>

      {/* ПОДАРКИ */}
      <section
        style={{
          display: 'grid', gap: 12, padding: 14, borderRadius: 16,
          border: '1px solid rgba(120,170,255,.25)',
          background: 'radial-gradient(140% 140% at 10% 0%, rgba(120,170,255,.14), rgba(255,255,255,.03))',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.04)'
        }}
      >
        <h3 style={{ margin: 0 }}>Подарки</h3>

        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ opacity: .85 }}>ID канала(ов) — через запятую</span>
          <input
            value={channelsStr}
            onChange={e => setChannelsStr(e.target.value)}
            placeholder="@AlfaBank,@yourChannel,-1001234567890"
            style={{ height: 38, borderRadius: 10, border: '1px solid #2b3552', background: '#121722', padding: '0 10px', color: 'var(--fg)' }}
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ opacity: .85 }}>Подарок</span>
          <select
            value={giftId}
            onChange={e => setGiftId(e.target.value)}
            disabled={loadingGifts || !gifts.length}
            style={{ height: 38, borderRadius: 10, border: '1px solid #2b3552', background: '#121722', padding: '0 10px', color: 'var(--fg)' }}
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
          <span style={{ opacity: .85 }}>Сообщение (опционально)</span>
          <textarea
            rows={3}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="🎁 Каждому по подарку!"
            style={{ borderRadius: 10, border: '1px solid #2b3552', background: '#121722', padding: '8px 10px', color: 'var(--fg)' }}
          />
        </label>

        <button
          type="button"
          onClick={() => { haptic('light'); send(); }}
          disabled={!giftId || !channelsStr.trim() || sending}
          className="list-btn"
          style={{ padding: '12px 14px', borderRadius: 12, background: '#2a3150', border: '1px solid #4b57b3', fontWeight: 800 }}
        >
          {sending ? 'Отправляем…' : 'Отправить'}
        </button>

        <pre
          style={{
            whiteSpace: 'pre-wrap',
            margin: 0,
            padding: 10,
            borderRadius: 10,
            border: '1px solid #2b3552',
            background: '#0f1421',
            fontSize: 12,
            lineHeight: 1.35,
            maxHeight: 260,
            overflow: 'auto'
          }}
        >{log || 'Лог появится здесь…'}</pre>

        <small style={{ opacity: .75 }}>
          Список — <code>getAvailableGifts</code>, отправка — <code>sendGift</code>. Нужен <b>BOT_TOKEN</b> на сервере.
        </small>
      </section>
    </main>
  );
}
