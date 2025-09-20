'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { qaTree, type Category, type Subcategory, type Followup } from '@/lib/qaTree';

type Msg = { role: 'user' | 'assistant'; content: string };
type MeResp = {
  ok: boolean;
  subscription?: { active: boolean; expiresAt?: string | null };
};

// ✅ FIX: добавлен 'chat' в union
type Phase = 'root' | 'sub' | 'followups' | 'freeinput' | 'chat';

export default function AssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMe, setLoadingMe] = useState(true);
  const [isPro, setIsPro] = useState(false);

  const [phase, setPhase] = useState<Phase>('root');
  const [category, setCategory] = useState<Category | null>(null);
  const [subcategory, setSubcategory] = useState<Subcategory | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [fIndex, setFIndex] = useState(0); // индекс followup

  const boxRef = useRef<HTMLDivElement>(null);

  const tgId = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const u = new URL(window.location.href);
    return u.searchParams.get('id') || '';
  }, []);

  // TWA init
  useEffect(() => {
    const w: any = window;
    w?.Telegram?.WebApp?.ready?.();
    w?.Telegram?.WebApp?.expand?.();
  }, []);

  // подписка
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`/api/me${tgId ? `?id=${encodeURIComponent(tgId)}` : ''}`, { cache: 'no-store' });
        const j: MeResp = await r.json();
        if (!alive) return;
        setIsPro(Boolean(j?.subscription?.active));
      } catch {
        /* noop */
      } finally {
        if (alive) setLoadingMe(false);
      }
    })();
    return () => { alive = false; };
  }, [tgId]);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' });
  }, [messages]);

  // ====== UI helpers ======
  const headerBlock = useMemo(() => {
    if (loadingMe) return <div style={{ opacity: .8 }}>Загрузка…</div>;
    const daily = Number(process.env.NEXT_PUBLIC_FREE_QA_PER_DAY || qaTree.freeDailyLimit);
    if (isPro) {
      return (
        <div style={{ opacity: .9 }}>
          У вас активна подписка <b>Juristum Pro</b>. Задавайте вопросы без ограничений — получите подробный разбор и шаги.
        </div>
      );
    }
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

  function resetAll() {
    setPhase('root'); setCategory(null); setSubcategory(null);
    setAnswers({}); setFIndex(0);
  }

  function pickCategory(c: Category) {
    setCategory(c); setPhase('sub'); setSubcategory(null);
    setAnswers({}); setFIndex(0);
  }

  function pickSub(s: Subcategory) {
    setSubcategory(s);
    if (s.id === 'other' || (category?.followups?.length ?? 0) === 0) {
      setPhase('freeinput');
    } else {
      setPhase('followups'); setFIndex(0);
    }
  }

  function setAnswerAndNext(curr: Followup, value: string) {
    setAnswers((a) => ({ ...a, [curr.id]: value }));
    const total = category?.followups?.length || 0;
    const next = fIndex + 1;
    if (next >= total) setPhase('freeinput');
    else setFIndex(next);
  }

  function followupsLine(): string {
    return Object.entries(answers).map(([k, v]) => `${k}=${v}`).join('; ') || '—';
  }

  function buildPrompt(userText: string): string {
    const catTitle = category?.title || '—';
    const subTitle = subcategory?.title || '—';
    return qaTree.promptTemplate
      .replace('{{categoryTitle}}', catTitle)
      .replace('{{subcategoryTitle}}', subTitle)
      .replace('{{followups}}', followupsLine())
      .replace('{{userText}}', userText || '—');
  }

  // ====== Chat send ======
  async function sendRawPrompt(prompt: string) {
    setMessages((m) => [...m, { role: 'user', content: prompt }]);
    setLoading(true);
    try {
      const res = await fetch(`/api/assistant/ask${tgId ? `?id=${encodeURIComponent(tgId)}` : ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, history: messages.slice(-6) })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        const err = data?.error || `HTTP_${res.status}`;
        if (err === 'FREE_LIMIT_REACHED') {
          setMessages((m) => [...m, { role: 'assistant',
            content: 'Лимит бесплатных ответов на сегодня исчерпан. Оформите Pro для безлимита.' }]);
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
      setPhase('chat'); // после первого ответа переходим в полноценный чат
    }
  }

  async function finalizeAndAsk() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const prompt = buildPrompt(text);
    await sendRawPrompt(prompt);
  }

  // быстрый свободный режим (когда уже в чате)
  async function send() {
    const prompt = input.trim();
    if (!prompt || loading) return;
    setInput('');
    await sendRawPrompt(prompt);
  }

  // ====== Render ======
  const IN_CHAT = phase === 'chat';

  const content = (() => {
    // 1) Корень: выбираем категорию
    if (phase === 'root') {
      return (
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ marginBottom: 8 }}>{headerBlock}</div>
          {qaTree.categories.map((c) => (
            <button key={c.id} className="list-btn"
              onClick={() => pickCategory(c)}
              style={{ textAlign: 'left', border: '1px solid #333', borderRadius: 12, padding: '12px 16px' }}>
              <span className="list-btn__left">
                <span className="list-btn__emoji">📂</span>
                <b>{c.title}</b>
              </span>
              <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
            </button>
          ))}
        </div>
      );
    }

    // 2) Подкатегории
    if (phase === 'sub' && category) {
      return (
        <div style={{ display: 'grid', gap: 8 }}>
          <p style={{ opacity: .8, marginTop: 0 }}>Сфера: <b>{category.title}</b>. Выберите тему:</p>
          {category.sub.map((s) => (
            <button key={s.id} className="list-btn"
              onClick={() => pickSub(s)}
              style={{ textAlign: 'left', border: '1px solid #333', borderRadius: 12, padding: '12px 16px' }}>
              <span className="list-btn__left">
                <span className="list-btn__emoji">📌</span>
                <b>{s.title}</b>
              </span>
              <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
            </button>
          ))}
          <button onClick={resetAll} className="list-btn"
            style={{ border: '1px solid #333', borderRadius: 12, padding: '10px 14px' }}>
            ⟵ Назад к выбору сфер
          </button>
        </div>
      );
    }

    // 3) Followups
    if (phase === 'followups' && category && subcategory) {
      const curr = category.followups[fIndex];
      const total = category.followups.length;

      return (
        <div style={{ display: 'grid', gap: 12 }}>
          <p style={{ opacity: .8, marginTop: 0 }}>
            {category.title} → <b>{subcategory.title}</b><br />
            Вопрос {fIndex + 1} из {total}
          </p>
          {'options' in curr ? (
            <div style={{ display: 'grid', gap: 8 }}>
              <p style={{ margin: 0 }}>{curr.label}</p>
              {curr.options.map((opt) => (
                <button key={opt} className="list-btn"
                  onClick={() => setAnswerAndNext(curr, opt)}
                  style={{ textAlign: 'left', border: '1px solid #333', borderRadius: 12, padding: '10px 14px' }}>
                  {opt}
                </button>
              ))}
              <button className="list-btn"
                onClick={() => setAnswerAndNext(curr, '—')}
                style={{ textAlign: 'left', border: '1px solid #333', borderRadius: 12, padding: '10px 14px' }}>
                Пропустить
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              <label>{curr.label}</label>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => (e.key === 'Enter' ? (setAnswerAndNext(curr, input.trim() || '—'), setInput('')) : null)}
                placeholder="Краткий ответ…"
                style={{
                  padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)',
                  background: 'transparent', color: 'inherit', outline: 'none'
                }}
              />
              <button
                onClick={() => { setAnswerAndNext(curr, input.trim() || '—'); setInput(''); }}
                className="list-btn"
                style={{ border: '1px solid #333', borderRadius: 12, padding: '10px 14px' }}>
                Далее
              </button>
            </div>
          )}
          <button onClick={() => setPhase('freeinput')} className="list-btn"
            style={{ border: '1px solid #333', borderRadius: 12, padding: '10px 14px' }}>
            Пропустить уточнения и описать ситуацию
          </button>
          <button onClick={() => setPhase('sub')} className="list-btn"
            style={{ border: '1px solid #333', borderRadius: 12, padding: '10px 14px' }}>
            ⟵ Назад к темам
          </button>
        </div>
      );
    }

    // 4) Свободный ввод (последний шаг перед AI)
    if (phase === 'freeinput' && category && subcategory) {
      return (
        <div style={{ display: 'grid', gap: 8 }}>
          <p style={{ marginTop: 0, opacity: .8 }}>
            {category.title} → <b>{subcategory.title}</b><br />
            Теперь опишите ситуацию своими словами (кто, что произошло, когда, чего хотите добиться).
          </p>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={5}
            placeholder="Опишите вашу ситуацию…"
            style={{
              padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)',
              background: 'transparent', color: 'inherit', outline: 'none', resize: 'vertical'
            }}
          />
          <button onClick={finalizeAndAsk} disabled={!input.trim() || loading} className="list-btn"
            style={{ border: '1px solid #333', borderRadius: 12, padding: '10px 14px' }}>
            Получить разбор
          </button>
          <button onClick={() => setPhase('followups')} className="list-btn"
            style={{ border: '1px solid #333', borderRadius: 12, padding: '10px 14px' }}>
            ⟵ Назад к уточняющим вопросам
          </button>
          <button onClick={() => setPhase('sub')} className="list-btn"
            style={{ border: '1px solid #333', borderRadius: 12, padding: '10px 14px' }}>
            ⟵ Назад к темам
          </button>
        </div>
      );
    }

    // 5) Полноценный чат после первого ответа
    return (
      <div style={{ display: 'grid', gap: 12, height: '100%' }}>
        <div ref={boxRef} style={{ padding: 4, overflowY: 'auto', flex: 1 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ opacity: .6, fontSize: 12, marginBottom: 4 }}>
                {m.role === 'user' ? 'Вы' : 'Ассистент'}
              </div>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{m.content}</div>
            </div>
          ))}
          {loading && <div style={{ opacity: .6 }}>Думаю…</div>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => (e.key === 'Enter' ? send() : null)}
            placeholder="Задайте уточняющий вопрос…"
            style={{
              flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)',
              background: 'transparent', color: 'inherit', outline: 'none'
            }}
          />
          <button onClick={send} disabled={loading || !input.trim()} className="list-btn" style={{ padding: '0 16px' }}>
            Отправить
          </button>
        </div>
      </div>
    );
  })();

  return (
    <main style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center' }}>Юридический ассистент</h1>

      <div style={{
        marginTop: 16,
        padding: 0,
        borderRadius: 12,
        border: '1px solid var(--border)',
        background: 'var(--panel)',
        display: 'flex',
        flexDirection: 'column',
        height: '70vh'
      }}>
        <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
          {messages.length === 0 ? (
            <div style={{ marginBottom: 12 }}>{headerBlock}</div>
          ) : null}
          {content}
        </div>

        {/* Нижняя панель показывается только в режимах, где нужен инпут */}
        {IN_CHAT ? null : (
          <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
            {/* Доп.кнопка Pro — только если нет подписки и мы ещё не в чате */}
            {!isPro && !IN_CHAT && (
              <div style={{ display: 'grid', gap: 8 }}>
                <Link href="/pro" className="list-btn" style={{ textDecoration: 'none' }}>
                  <span className="list-btn__left">
                    <span className="list-btn__emoji">⭐</span>
                    <b>Оформить Pro</b>
                  </span>
                  <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
