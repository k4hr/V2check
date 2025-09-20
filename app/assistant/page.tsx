'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

type Msg = { role: 'user' | 'assistant'; content: string };
type MeResp = {
  ok: boolean;
  user?: { telegramId?: string; username?: string | null };
  subscription?: { active: boolean; expiresAt?: string | null };
};

export default function AssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMe, setLoadingMe] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // id из URL (?id=...), как у тебя уже сделано
  const tgId = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const u = new URL(window.location.href);
    return u.searchParams.get('id') || '';
  }, []);

  // инициализация TWA
  useEffect(() => {
    const w: any = window;
    w?.Telegram?.WebApp?.ready?.();
    w?.Telegram?.WebApp?.expand?.();
  }, []);

  // статус подписки
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`/api/me${tgId ? `?id=${encodeURIComponent(tgId)}` : ''}`, { cache: 'no-store' });
        const j: MeResp = await r.json();
        if (!alive) return;
        setIsPro(Boolean(j?.subscription?.active));
      } catch {
        /* ignore */
      } finally {
        if (alive) setLoadingMe(false);
      }
    })();
    return () => { alive = false; };
  }, [tgId]);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' });
  }, [messages]);

  async function send() {
    const prompt = input.trim();
    if (!prompt || loading) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: prompt }]);
    setLoading(true);

    try {
      const res = await fetch(`/api/assistant/ask${tgId ? `?id=${encodeURIComponent(tgId)}` : ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          history: messages.slice(-6), // последние 6 реплик в контекст
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        const err = data?.error || `HTTP_${res.status}`;
        if (err === 'FREE_LIMIT_REACHED') {
          setMessages((m) => [
            ...m,
            { role: 'assistant', content: 'Лимит бесплатных ответов на сегодня исчерпан. Оформите Pro для безлимита.' },
          ]);
        } else {
          setMessages((m) => [...m, { role: 'assistant', content: `Ошибка: ${err}` }]);
        }
      } else {
        setMessages((m) => [...m, { role: 'assistant', content: data.answer }]);
      }
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Сбой сети. Попробуйте ещё раз.' }]);
    } finally {
      setLoading(false);
    }
  }

  const headerBlock = useMemo(() => {
    if (loadingMe) {
      return <div style={{ opacity: .8 }}>Загрузка…</div>;
    }
    if (isPro) {
      return (
        <div style={{ opacity: .9 }}>
          У вас активна подписка <b>Juristum Pro</b>. Задавайте вопросы без ограничений — получите подробный разбор и
          пошаговые действия.
        </div>
      );
    }
    const daily = Number(process.env.NEXT_PUBLIC_FREE_QA_PER_DAY || 2);
    return (
      <div style={{ opacity: .9 }}>
        Задайте вопрос — получите разбор и пошаговые действия.
        <ul style={{ marginTop: 8 }}>
          <li>• Бесплатно: {daily} ответ(а) в день</li>
          <li>• Pro: безлимитные ответы и расширенные разъяснения</li>
        </ul>
      </div>
    );
  }, [loadingMe, isPro]);

  return (
    <main style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center' }}>Юридический ассистент</h1>

      <div
        style={{
          marginTop: 16,
          padding: 0,
          borderRadius: 12,
          border: '1px solid var(--border)',
          background: 'var(--panel)',
          display: 'flex',
          flexDirection: 'column',
          height: '70vh',
        }}
      >
        <div ref={boxRef} style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
          {messages.length === 0 ? (
            <div>{headerBlock}</div>
          ) : (
            messages.map((m, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ opacity: .6, fontSize: 12, marginBottom: 4 }}>
                  {m.role === 'user' ? 'Вы' : 'Ассистент'}
                </div>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{m.content}</div>
              </div>
            ))
          )}
          {loading && <div style={{ opacity: .6 }}>Думаю…</div>}
        </div>

        <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => (e.key === 'Enter' ? send() : null)}
              placeholder="Опишите вашу ситуацию…"
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'inherit',
                outline: 'none',
              }}
            />
            <button onClick={send} disabled={loading || !input.trim()} className="list-btn" style={{ padding: '0 16px' }}>
              Отправить
            </button>
          </div>

          {/* Кнопку «Оформить Pro» показываем только если подписки нет */}
          {!isPro && (
            <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
              <Link href="/pro" className="list-btn" style={{ textDecoration: 'none' }}>
                <span className="list-btn__left">
                  <span className="list-btn__emoji">⭐</span>
                  <b>Оформить Pro</b>
                </span>
                <span className="list-btn__right">
                  <span className="list-btn__chev">›</span>
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Кнопку «На главную» убрали. Навигация — системная «Назад» в верхнем баре Telegram. */}
    </main>
  );
}
