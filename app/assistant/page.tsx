'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Msg, Phase, QItem,
  COMPACT_BTN_STYLE,
  ROOT_TOPICS, SUB_TOPICS, RAW_FOLLOWUPS,
  norm
} from './config';
import { UI, composeCaseTitle } from './strings';

export default function AssistantPage() {
  const [phase, setPhase] = useState<Phase>('root');
  const [selectedRoot, setSelectedRoot] = useState<string>('');
  const [selectedSub,  setSelectedSub]  = useState<string>('');
  const [followupIdx, setFollowupIdx] = useState<number>(0);
  const [followupAnswers, setFollowupAnswers] = useState<string[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPro, setIsPro] = useState<boolean>(false);
  const [createdCaseId, setCreatedCaseId] = useState<string | null>(null);

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

  // Проверка подписки
  useEffect(() => {
    (async () => {
      try {
        const w: any = window;
        const initData: string | undefined = w?.Telegram?.WebApp?.initData;

        const res = await fetch(`/api/me${tgId ? `?id=${encodeURIComponent(tgId)}` : ''}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(initData ? { 'x-init-data': initData } : {}) },
          cache: 'no-store',
        });
        const data = await res.json();
        setIsPro(Boolean(data?.subscription?.active));
      } catch { setIsPro(false); }
    })();
  }, [tgId]);

  // Автоскролл
  useEffect(() => {
    boxRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' });
  }, [messages]);

  // Текущий набор уточняющих
  const followupQuestions = useMemo<QItem[]>(() => {
    if (!selectedRoot || !selectedSub) return [];
    return norm(RAW_FOLLOWUPS[selectedRoot]?.[selectedSub]);
  }, [selectedRoot, selectedSub]);

  // Навигация
  function startSub(rootKey: string) {
    setSelectedRoot(rootKey);
    setSelectedSub('');
    setFollowupIdx(0);
    setFollowupAnswers([]);
    setMessages([]);
    setPhase('sub');
    setCreatedCaseId(null);
  }

  function followupQuestionsFor(root: string, sub: string): QItem[] {
    return norm(RAW_FOLLOWUPS[root]?.[sub]);
  }

  function chooseSub(subKey: string) {
    setSelectedSub(subKey);
    setFollowupIdx(0);
    setFollowupAnswers([]);
    setMessages([]);
    setCreatedCaseId(null);

    const q = followupQuestionsFor(selectedRoot, subKey);
    if (q.length > 0) {
      setMessages([{ role: 'assistant', content: q[0].text }]);
      setPhase('chat');
    } else {
      setMessages([{ role: 'assistant', content: 'Опишите вашу ситуацию.' }]);
      setPhase('chat');
    }
  }

  // Paywall
  function showPaywall() {
    setMessages((m) => [...m, { role: 'assistant', content: UI.paywall }]);
  }

  // Отправка
  async function send(userText: string) {
    const prompt = userText.trim();
    if (!prompt || loading) return;

    setMessages((m) => [...m, { role: 'user', content: prompt }]);

    // Блок уточняющих
    if (followupIdx < followupQuestions.length) {
      setFollowupAnswers((a) => {
        const next = [...a];
        next[followupIdx] = prompt;
        return next;
      });

      const nextIdx = followupIdx + 1;
      if (nextIdx < followupQuestions.length) {
        setFollowupIdx(nextIdx);
        setMessages((m) => [...m, { role: 'assistant', content: followupQuestions[nextIdx].text }]);
        return;
      }

      // Уточняющие закончились → формируем ответ
      setFollowupIdx(nextIdx);
      if (!isPro) { showPaywall(); return; }
      await askAIWithContext();
      return;
    }

    // Обычный чат
    if (!isPro) { showPaywall(); return; }
    await askAIWithContext(prompt);
  }

  // Автосоздание дела после ответа ИИ
  async function saveCaseToCabinet(answerText: string) {
    try {
      const title = composeCaseTitle(selectedRoot, selectedSub);
      const qa = followupQuestions.map((q, i) => ({ q: q.text, a: followupAnswers[i] ?? '' }));

      const w: any = window;
      const initData: string | undefined = w?.Telegram?.WebApp?.initData;

      const res = await fetch(`/api/cases/auto-create${tgId ? `?id=${encodeURIComponent(tgId)}` : ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(initData ? { 'x-init-data': initData } : {}),
        },
        body: JSON.stringify({ title, root: selectedRoot, sub: selectedSub, qa, answer: answerText }),
      });

      const data = await res.json();
      if (res.ok && data?.ok && data?.caseId) {
        setCreatedCaseId(String(data.caseId));
        setMessages((m) => [...m, { role: 'assistant', content: UI.saveOk }]);
      } else {
        setMessages((m) => [...m, { role: 'assistant', content: UI.saveFail }]);
      }
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: UI.saveError }]);
    }
  }

  async function askAIWithContext(optionalUserMessage?: string) {
    setLoading(true);
    try {
      const qaPairs =
        followupQuestions.length > 0
          ? followupQuestions.map((q, i) => `• ${q.text} — ${followupAnswers[i] ?? ''}`).join('\n')
          : '';

      const systemContext =
        `Категории: root=${selectedRoot || '—'}, sub=${selectedSub || '—'}.\n` +
        (qaPairs ? `Уточняющие:\n${qaPairs}\n` : '');

      const history: Msg[] = [
        { role: 'user', content: systemContext },
        ...messages.slice(-8),
      ];
      if (optionalUserMessage) history.push({ role: 'user', content: optionalUserMessage });

      const w: any = window;
      const initData: string | undefined = w?.Telegram?.WebApp?.initData;

      const res = await fetch(`/api/assistant/ask${tgId ? `?id=${encodeURIComponent(tgId)}` : ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(initData ? { 'x-init-data': initData } : {}) },
        body: JSON.stringify({ prompt: optionalUserMessage ?? 'Сформируй разбор и пошаговые действия.', history }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        const err = data?.error || `HTTP_${res.status}`;
        setMessages((m) => [...m, { role: 'assistant', content: `Ошибка: ${err}. Попробуйте ещё раз.` }]);
      } else {
        const answer = String(data.answer || '');
        setMessages((m) => [...m, { role: 'assistant', content: answer }]);
        await saveCaseToCabinet(answer);
      }
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Сбой сети. Попробуйте ещё раз.' }]);
    } finally {
      setLoading(false);
    }
  }

  // Быстрый выбор (для mode:'choice')
  function chooseOption(opt: string) { void send(opt); }

  // Отправка из поля ввода
  function onSend() {
    const val = input.trim();
    if (!val) return;
    setInput('');
    void send(val);
  }

  // Назад
  function goBack() {
    if (phase === 'sub') {
      setPhase('root');
      setSelectedRoot('');
      setSelectedSub('');
      setFollowupIdx(0);
      setFollowupAnswers([]);
      setMessages([]);
      setCreatedCaseId(null);
      return;
    }
    if (phase === 'chat') {
      if (followupIdx > 0 && followupIdx <= followupQuestions.length) {
        setMessages((m) => {
          const mm = [...m];
          if (mm.length && mm[mm.length - 1]?.role === 'assistant') mm.pop();
          return mm;
        });
        setFollowupIdx((i) => Math.max(0, i - 1));
        return;
      }
      setPhase('sub');
      setMessages([]);
      setFollowupIdx(0);
      setFollowupAnswers([]);
      setCreatedCaseId(null);
      return;
    }
  }

  // Текущий уточняющий (для кнопок выбора)
  const currentQ: QItem | undefined =
    phase === 'chat' && followupIdx < followupQuestions.length
      ? followupQuestions[followupIdx]
      : undefined;

  const choiceModeActive = Boolean(currentQ && currentQ.mode === 'choice' && currentQ.options?.length);

  return (
    <main style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center' }}>{UI.appTitle}</h1>

      {phase !== 'root' && (
        <div style={{ marginTop: 8 }}>
          <button onClick={goBack} className="list-btn" style={{ ...COMPACT_BTN_STYLE, maxWidth: 140 }}>
            {UI.backBtn}
          </button>
        </div>
      )}

      {/* Этап 1: категории */}
      {phase === 'root' && (
        <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          {ROOT_TOPICS.map((t) => (
            <button
              key={t.key}
              className="list-btn"
              onClick={() => startSub(t.key)}
              style={{ ...COMPACT_BTN_STYLE }}
            >
              <span className="list-btn__left"><b>{t.label}</b></span>
              <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
            </button>
          ))}
        </div>
      )}

      {/* Этап 2: подкатегории */}
      {phase === 'sub' && selectedRoot && (
        <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          {SUB_TOPICS[selectedRoot].map((s) => (
            <button
              key={s.key}
              className="list-btn"
              onClick={() => chooseSub(s.key)}
              style={{ ...COMPACT_BTN_STYLE }}
            >
              <span className="list-btn__left"><b>{s.label}</b></span>
              <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
            </button>
          ))}
        </div>
      )}

      {/* Этап 3: чат */}
      {phase === 'chat' && (
        <div
          style={{
            marginTop: 12,
            borderRadius: 12,
            border: '1px solid var(--border)',
            background: 'var(--panel)',
            display: 'flex',
            flexDirection: 'column',
            height: '65vh'
          }}
        >
          <div ref={boxRef} style={{ padding: 12, overflowY: 'auto', flex: 1 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ opacity: .6, fontSize: 12, marginBottom: 4 }}>
                  {m.role === 'user' ? 'Вы' : 'Ассистент'}
                </div>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, fontSize: 14 }}>{m.content}</div>
              </div>
            ))}
            {loading && <div style={{ opacity: .6, fontSize: 14 }}>{UI.typing}</div>}
          </div>

          {/* Подтверждение сохранения */}
          {createdCaseId && (
            <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13 }}>
                {UI.saveOk} <a href={`/cabinet/cases/${createdCaseId}`} style={{ textDecoration: 'none' }}>{UI.openCase(createdCaseId)}</a>
              </div>
            </div>
          )}

          {/* Кнопки выбора */}
          {currentQ && currentQ.mode === 'choice' && currentQ.options?.length ? (
            <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {currentQ.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => chooseOption(opt)}
                  className="list-btn"
                  style={{ padding: '6px 10px', borderRadius: 8, fontSize: 13 }}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : null}

          <div style={{ padding: 10, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => (!choiceModeActive && e.key === 'Enter' ? onSend() : null)}
                placeholder={choiceModeActive ? UI.chooseAbovePlaceholder : UI.inputPlaceholder}
                disabled={choiceModeActive}
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)',
                  background: 'transparent', color: 'inherit', outline: 'none', fontSize: 14, opacity: choiceModeActive ? 0.6 : 1
                }}
              />
              <button
                onClick={onSend}
                disabled={choiceModeActive || loading || !input.trim()}
                className="list-btn"
                style={{ padding: '0 16px' }}
              >
                Отправить
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ height: 12 }} />
    </main>
  );
}
