'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { SUPER_LEGAL_PROMPT } from './prompt';

type Msg = { role: 'user' | 'assistant'; content: string };

export default function ProPlusChatPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'assistant',
      content:
        'Это Pro+ Чат ИИ. Опишите вашу ситуацию одним сообщением: кто участники, что произошло, когда, какие суммы/документы, чего хотите добиться. ' +
        'Я сразу сформирую полный разбор со стратегиями, планом, сроками и шаблонами. Если чего-то не будет хватать, в конце добавлю список уточнений.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const boxRef = useRef<HTMLDivElement>(null);

  // ?id= для дебага
  const tgId = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const u = new URL(window.location.href);
    return u.searchParams.get('id') || '';
  }, []);

  // Telegram WebApp init
  useEffect(() => {
    const w: any = window;
    try { w?.Telegram?.WebApp?.ready?.(); w?.Telegram?.WebApp?.expand?.(); } catch {}
  }, []);

  // автоскролл
  useEffect(() => {
    boxRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' });
  }, [messages, loading]);

  async function send(userText?: string) {
    const text = (userText ?? input).trim();
    if (!text || loading) return;

    setMessages((m) => [...m, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);

    try {
      // собираем историю (не длиннее 12 сообщений)
      const history = [...messages, { role: 'user', content: text }].slice(-12);

      const w: any = window;
      const initData: string | undefined = w?.Telegram?.WebApp?.initData;

      const res = await fetch(`/api/assistant/ask${tgId ? `?id=${encodeURIComponent(tgId)}` : ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(initData ? { 'x-init-data': initData } : {}),
        },
        body: JSON.stringify({
          prompt: text,
          // «мягкий» праймер на случай, если сервер не поддерживает role:system
          history: [{ role: 'user', content: SUPER_LEGAL_PROMPT }, ...history],
          // «жёсткий» праймер для серверов, понимающих поле system
          system: SUPER_LEGAL_PROMPT,
          mode: 'legal-full-one-shot',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        const err = data?.error || `HTTP_${res.status}`;
        setMessages((m) => [...m, { role: 'assistant', content: `Ошибка: ${err}.` }]);
      } else {
        setMessages((m) => [...m, { role: 'assistant', content: String(data.answer || '') }]);
      }
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Сбой сети. Попробуйте ещё раз.' }]);
    } finally {
      setLoading(false);
    }
  }

  function onSend() {
    if (!input.trim()) return;
    void send();
  }

  return (
    <main style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center' }}>Pro+ Чат ИИ</h1>

      <div
        style={{
          marginTop: 12,
          borderRadius: 12,
          border: '1px solid var(--border)',
          background: 'var(--panel)',
          display: 'flex',
          flexDirection: 'column',
          height: '70vh'
        }}
      >
        {/* История */}
        <div ref={boxRef} style={{ padding: 12, overflowY: 'auto', flex: 1 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ opacity: .6, fontSize: 12, marginBottom: 4 }}>
                {m.role === 'user' ? 'Вы' : 'ИИ'}
              </div>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, fontSize: 14 }}>{m.content}</div>
            </div>
          ))}
          {loading && <div style={{ opacity: .6, fontSize: 14 }}>ИИ печатает…</div>}
        </div>

        {/* Поле ввода */}
        <div style={{ padding: 10, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => (e.key === 'Enter' ? onSend() : null)}
              placeholder="Опишите ситуацию: кто, что, когда, суммы/документы, желаемый результат"
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'inherit',
                outline: 'none',
                fontSize: 14
              }}
            />
            <button
              onClick={onSend}
              disabled={loading || !input.trim()}
              className="list-btn"
              style={{ padding: '0 16px' }}
            >
              Отправить
            </button>
          </div>
        </div>
      </div>

      <div style={{ height: 12 }} />
    </main>
  );
}
