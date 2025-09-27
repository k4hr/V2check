// app/pro-plus/plan/launch/page.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as PR from './prompt'; // локальный prompt.ts

type Msg = { role: 'user' | 'assistant'; content: string };

const PROMPT_LAUNCH: string =
  (PR as any).PROMPT_LAUNCH ?? (PR as any).default ?? '';

function getCookie(name: string): string {
  try {
    const p = (document.cookie || '').split('; ').find(r => r.startsWith(name + '='));
    return p ? decodeURIComponent(p.split('=').slice(1).join('=')) : '';
  } catch { return ''; }
}

export default function LaunchChatPage() {
  const router = useRouter();

  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'assistant',
      content:
        'Это чат «Запуск — Pro+». Опишите вашу задачу одним сообщением: что вы хотите запустить, для кого, текущее состояние, ограничения и цель. Я разложу через 5 ментальных моделей и дам чёткий план.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const tgId = useMemo(() => {
    try { const u = new URL(window.location.href); return u.searchParams.get('id') || ''; }
    catch { return ''; }
  }, []);

  useEffect(() => {
    const w: any = window;
    try { w?.Telegram?.WebApp?.ready?.(); w?.Telegram?.WebApp?.expand?.(); } catch {}
  }, []);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' });
  }, [messages, loading]);

  async function send(userText?: string) {
    const text = (userText ?? input).trim();
    if (!text || loading) return;

    setMessages(m => [...m, { role:'user', content:text }]);
    setInput('');
    setLoading(true);

    try {
      const history = [...messages, { role:'user', content:text }].slice(-12);
      const w: any = window;
      const initData: string | undefined = w?.Telegram?.WebApp?.initData;
      const locale = (getCookie('locale') || 'ru').toLowerCase();

      const system = `${PROMPT_LAUNCH}\n\nSYSTEM NOTE: Reply strictly in language "${locale}".`;

      const res = await fetch(`/api/assistant/ask${tgId ? `?id=${encodeURIComponent(tgId)}` : ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(initData ? { 'x-init-data': initData } : {}),
        },
        body: JSON.stringify({
          prompt: text,
          history: [{ role: 'user', content: system }, ...history],
          system,
          mode: 'proplus-launch',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setMessages(m => [...m, { role:'assistant', content:`Ошибка: ${data?.error || `HTTP_${res.status}`}.` }]);
      } else {
        setMessages(m => [...m, { role:'assistant', content:String(data.answer || '') }]);
      }
    } catch {
      setMessages(m => [...m, { role:'assistant', content:'Сбой сети. Попробуйте ещё раз.' }]);
    } finally {
      setLoading(false);
    }
  }

  function onSend(){ if (input.trim()) void send(); }

  return (
    <main style={{ padding:20, maxWidth:900, margin:'0 auto' }}>
      <button type="button" onClick={() => router.back()} className="list-btn" style={{ maxWidth:120, marginBottom:12 }}>
        ← Назад
      </button>
      <h1 style={{ textAlign:'center' }}>Запуск — Pro+</h1>

      <div
        style={{
          marginTop:12, borderRadius:12, border:'1px solid var(--border)',
          background:'var(--panel)', display:'flex', flexDirection:'column', height:'70vh'
        }}
      >
        <div ref={boxRef} style={{ padding:12, overflowY:'auto', flex:1 }}>
          {messages.map((m,i)=>(
            <div key={i} style={{ marginBottom:12 }}>
              <div style={{ opacity:.6, fontSize:12, marginBottom:4 }}>{m.role==='user' ? 'Вы' : 'ИИ'}</div>
              <div style={{ whiteSpace:'pre-wrap', lineHeight:1.5, fontSize:14 }}>{m.content}</div>
            </div>
          ))}
          {loading && <div style={{ opacity:.6, fontSize:14 }}>ИИ печатает…</div>}
        </div>

        <div style={{ padding:10, borderTop:'1px solid var(--border)' }}>
          <div style={{ display:'flex', gap:8 }}>
            <input
              value={input}
              onChange={(e)=>setInput(e.target.value)}
              onKeyDown={(e)=> (e.key==='Enter' ? onSend() : null)}
              placeholder="Опишите задачу для запуска (что/для кого/цель/ограничения)"
              style={{
                flex:1, padding:'10px 12px', borderRadius:10, border:'1px solid var(--border)',
                background:'transparent', color:'inherit', outline:'none', fontSize:14
              }}
            />
            <button onClick={onSend} disabled={loading || !input.trim()} className="list-btn" style={{ padding:'0 16px' }}>
              Отправить
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
