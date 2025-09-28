'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import BackBtn from '../../../components/BackBtn';
import PROMPT from './prompt';

type Msg = { role: 'system' | 'user' | 'assistant'; content: string };

export default function CinemaConcierge() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'system', content: PROMPT },
    { role: 'assistant', content: 'Что хотите посмотреть сегодня: фильм или сериал?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const w: any = window;
    try { w?.Telegram?.WebApp?.ready?.(); w?.Telegram?.WebApp?.expand?.(); } catch {}
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: 999999, behavior: 'smooth' });
  }, [messages, loading]);

  const idSuffix = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      const id = u.searchParams.get('id');
      return id ? `?id=${encodeURIComponent(id)}` : '';
    } catch { return ''; }
  }, []);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    const next = [...messages, { role: 'user', content: text } as Msg];
    setMessages(next);
    setLoading(true);
    try {
      // универсальный /api/ai (для Pro — gpt-4o-mini)
      const r = await fetch('/api/ai' + idSuffix, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: next }),
      });
      const data = await r.json();
      const reply = (data?.text || data?.message || '').toString().trim();
      setMessages((m) => [...m, { role: 'assistant', content: reply || 'Готово. Продолжим?' }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Не получилось получить ответ. Попробуем ещё раз?' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 20, maxWidth: 800, margin: '0 auto', display: 'grid', gap: 12 }}>
      <BackBtn fallback="/home/pro" />
      <h1 style={{ textAlign: 'center' }}>🎬 Подбор фильма/сериала</h1>
      <p style={{ textAlign: 'center', opacity: 0.75, marginTop: -4 }}>
        Киноконсерж задаст несколько вопросов и подберёт идеальные варианты.
      </p>

      <div
        ref={listRef}
        style={{
          border: '1px solid var(--border)',
          borderRadius: 14,
          background: '#121722',
          padding: 12,
          height: '54vh',
          overflow: 'auto',
        }}
      >
        {messages
          .filter((m) => m.role !== 'system')
          .map((m, i) => (
            <div
              key={i}
              style={{ margin: '10px 0', display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}
            >
              <div
                style={{
                  maxWidth: '82%',
                  padding: '10px 12px',
                  borderRadius: 12,
                  lineHeight: 1.5,
                  background: m.role === 'user' ? '#24304a' : '#1a2132',
                  border: '1px solid #2b3552',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {m.content}
              </div>
            </div>
          ))}
        {loading && <div style={{ opacity: 0.6, fontSize: 12, padding: '6px 2px' }}>ИИ печатает…</div>}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Опишите настроение, жанры, платформу…"
          style={{
            flex: 1,
            padding: '12px 12px',
            borderRadius: 12,
            border: '1px solid var(--border)',
            background: '#121722',
            color: 'var(--fg)',
          }}
        />
        <button onClick={send} disabled={loading || !input.trim()} className="list-btn" style={{ padding: '0 16px' }}>
          Отправить
        </button>
      </div>
    </main>
  );
}
