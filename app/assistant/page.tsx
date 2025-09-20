'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Msg = { role: 'user' | 'assistant'; content: string };
type Phase = 'root' | 'sub' | 'chat';

const ROOT_TOPICS = [
  { key: 'labor',    label: 'Трудовые вопросы' },
  { key: 'housing',  label: 'Жильё и недвижимость' },
  { key: 'consumer', label: 'Права потребителей' },
  { key: 'family',   label: 'Семейные вопросы' },
  { key: 'traffic',  label: 'Штрафы и ДТП' },
  { key: 'other',    label: 'Другое' },
] as const;

const COMPACT_BTN_STYLE: React.CSSProperties = {
  textAlign: 'left',
  border: '1px solid var(--border, #333)',
  borderRadius: 10,
  padding: '8px 12px',
  fontSize: 14,
  lineHeight: 1.3,
  background: 'transparent',
  color: 'inherit',
};

export default function AssistantPage() {
  // Навигация
  const [phase, setPhase] = useState<Phase>('root');
  const [selectedRoot, setSelectedRoot] = useState<string>('');
  const [selectedSub,  setSelectedSub]  = useState<string>('');

  // Последовательные уточняющие
  const [followupIdx, setFollowupIdx] = useState<number>(0);
  const [followupAnswers, setFollowupAnswers] = useState<string[]>([]);

  // Контекст + чат
  const [contextTags, setContextTags] = useState<string[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPro, setIsPro] = useState<boolean>(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // ?id= дебаг
  const tgId = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const u = new URL(window.location.href);
    return u.searchParams.get('id') || '';
  }, []);

  // Инициализация TWA
  useEffect(() => {
    const w: any = window;
    try { w?.Telegram?.WebApp?.ready?.(); w?.Telegram?.WebApp?.expand?.(); } catch {}
  }, []);

  // Подтянем статус Pro
  useEffect(() => {
    (async () => {
      try {
        const w: any = window;
        const initData: string | undefined = w?.Telegram?.WebApp?.initData;

        const res = await fetch(`/api/me${tgId ? `?id=${encodeURIComponent(tgId)}` : ''}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(initData ? { 'x-init-data': initData } : {}),
          },
          cache: 'no-store',
        });
        const data = await res.json();
        setIsPro(Boolean(data?.subscription?.active));
      } catch {
        setIsPro(false);
      }
    })();
  }, [tgId]);

  // Автоскролл
  useEffect(() => {
    boxRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' });
  }, [messages]);

  // Подкатегории
  const SUB_TOPICS: Record<string, { key: string; label: string }[]> = {
    labor: [
      { key: 'dismissal', label: 'Увольнение/сокращение' },
      { key: 'salary',    label: 'Задержка зарплаты' },
      { key: 'contract',  label: 'Трудовой договор' },
      { key: 'vacation',  label: 'Отпуск/больничный' },
      { key: 'other',     label: 'Другое' },
    ],
    housing: [
      { key: 'rent',      label: 'Аренда/найм' },
      { key: 'purchase',  label: 'Покупка/продажа' },
      { key: 'neighbors', label: 'Соседи/шум' },
      { key: 'utilities', label: 'Коммунальные/управляйка' },
      { key: 'other',     label: 'Другое' },
    ],
    consumer: [
      { key: 'return',  label: 'Возврат/обмен товара' },
      { key: 'service', label: 'Плохая услуга' },
      { key: 'online',  label: 'Онлайн-покупка' },
      { key: 'warranty',label: 'Гарантия' },
      { key: 'other',   label: 'Другое' },
    ],
    family: [
      { key: 'divorce',  label: 'Развод' },
      { key: 'alimony',  label: 'Алименты' },
      { key: 'children', label: 'Дети/опека' },
      { key: 'property', label: 'Имущество/брачный договор' },
      { key: 'other',    label: 'Другое' },
    ],
    traffic: [
      { key: 'fine',   label: 'Штраф' },
      { key: 'accident', label: 'ДТП' },
      { key: 'rights', label: 'Лишение прав' },
      { key: 'osago',  label: 'ОСАГО/КАСКО' },
      { key: 'other',  label: 'Другое' },
    ],
    other: [
      { key: 'other', label: 'Другое' },
    ],
  };

  // Уточняющие вопросы
  const FOLLOWUPS: Record<string, Record<string, string[]>> = {
    labor: {
      dismissal: ['Инициатор увольнения?', 'Есть приказ/уведомление?', 'Дата события?'],
      salary:    ['Срок задержки?', 'Есть трудовой договор?', 'Платят частично или вовсе нет?'],
      contract:  ['Подписан ли договор?', 'Есть допсоглашения?', 'Какой график/ставка?'],
      vacation:  ['Тип отпуска/больничного?', 'Отказали или задерживают оплату?', 'Документы прилагались?'],
      other:     ['Опишите кратко проблему.'],
    },
    housing: {
      rent:      ['Вы арендодатель или наниматель?', 'Есть договор?', 'Какой спор возник?'],
      purchase:  ['Тип сделки?', 'Есть расписка/ДКП?', 'Стадия сейчас?'],
      neighbors: ['Характер проблемы?', 'Обращались в УК/полицию?', 'Доказательства есть?'],
      utilities: ['Что именно не так?', 'Проблема сколько длится?', 'Обращались ли в УК?'],
      other:     ['Опишите кратко проблему.'],
    },
    consumer: {
      return:   ['Когда купили?', 'Чек/документы есть?', 'Продавец отказал?'],
      service:  ['Какая услуга?', 'Договор/акт есть?', 'В чём нарушение?'],
      online:   ['Маркетплейс/сайт?', 'Статус заказа?', 'Переписка/доказательства есть?'],
      warranty: ['Срок эксплуатации?', 'Диагностика была?', 'Отказ по гарантии?'],
      other:    ['Опишите кратко проблему.'],
    },
    family: {
      divorce:  ['Есть дети?', 'Согласие сторон?', 'Имущественные споры?'],
      alimony:  ['Есть решение/соглашение?', 'Сумма/процент?', 'Есть задолженность?'],
      children: ['Опека/место жительства/порядок общения?', 'Идёт ли суд сейчас?'],
      property: ['Есть брачный договор?', 'Что делите?', 'Добрачное/совместно нажитое?'],
      other:    ['Опишите кратко проблему.'],
    },
    traffic: {
      fine:   ['Статья/вид штрафа?', 'Когда получено постановление?', 'Срок обжалования не прошёл?'],
      accident:['Есть схема/справка?', 'Кто виновник по версии ГИБДД?', 'Есть ОСАГО у сторон?'],
      rights: ['Статья лишения?', 'Когда составлен протокол?', 'Срок рассмотрения идёт?'],
      osago:  ['Какая страховая?', 'Что произошло?', 'Что подано уже?'],
      other:  ['Опишите кратко проблему.'],
    },
    other: {
      other: ['Опишите кратко проблему.'],
    },
  };

  const followupQuestions = useMemo<string[]>(() => {
    if (!selectedRoot || !selectedSub) return [];
    return FOLLOWUPS[selectedRoot]?.[selectedSub] ?? [];
  }, [selectedRoot, selectedSub]);

  function pushTag(tag: string) {
    setContextTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]));
  }

  // Старт: выбор корневой категории
  function startSub(rootKey: string) {
    setSelectedRoot(rootKey);
    setSelectedSub('');
    setFollowupIdx(0);
    setFollowupAnswers([]);
    setMessages([]);
    setPhase('sub');
    setContextTags([`root:${rootKey}`]);
  }

  // Выбор подкатегории → сразу начинаем последовательные вопросы в чате
  function chooseSub(subKey: string) {
    setSelectedSub(subKey);
    pushTag(`sub:${subKey}`);
    setFollowupIdx(0);
    setFollowupAnswers([]);
    setMessages([]);

    const q = FOLLOWUPS[selectedRoot]?.[subKey] ?? [];
    if (q.length > 0) {
      setMessages([{ role: 'assistant', content: q[0] }]);
      setPhase('chat');
    } else {
      // если нет вопросов — сразу просим описать проблему (и дальше paywall/AI)
      setMessages([{ role: 'assistant', content: 'Опишите вашу ситуацию.' }]);
      setPhase('chat');
    }
  }

  // Paywall
  function showPaywall() {
    setMessages((m) => [
      ...m,
      {
        role: 'assistant',
        content:
          'Ответ подготовлен. Чтобы увидеть его целиком и получить пошаговые действия, ' +
          'оформите подписку Juristum Pro.',
      },
    ]);
  }

  // Отправка реплики (во время уточняющих — идём по порядку; после — обычный чат к ИИ)
  async function send(text: string) {
    const prompt = text.trim();
    if (!prompt || loading) return;

    // зафиксировали ответ пользователя
    setMessages((m) => [...m, { role: 'user', content: prompt }]);

    // Если мы ещё в режиме уточняющих:
    const stillClarify = followupIdx < followupQuestions.length;
    if (stillClarify) {
      // сохраним ответ
      setFollowupAnswers((a) => {
        const next = [...a];
        next[followupIdx] = prompt;
        return next;
      });

      const nextIdx = followupIdx + 1;
      if (nextIdx < followupQuestions.length) {
        // показываем следующий вопрос
        setFollowupIdx(nextIdx);
        setMessages((m) => [...m, { role: 'assistant', content: followupQuestions[nextIdx] }]);
        return;
      }

      // это был последний уточняющий — дальше paywall/ИИ
      setFollowupIdx(nextIdx); // = questions.length
      if (!isPro) {
        showPaywall();
        return;
      }
      // С подпиской — отправляем сводку + последний ответ в ИИ
      return askAIWithContext();
    }

    // Если уточняющие уже закончены — это обычный чат к ИИ
    if (!isPro) {
      showPaywall();
      return;
    }
    await askAIWithContext(prompt);
  }

  // Собираем контекст и шлём в /api/assistant/ask
  async function askAIWithContext(optionalUserMessage?: string) {
    setLoading(true);
    try {
      const qaPairs =
        followupQuestions.length > 0
          ? followupQuestions.map((q, i) => `• ${q} — ${followupAnswers[i] ?? ''}`).join('\n')
          : '';

      const systemContext =
        `Категории: root=${selectedRoot || '—'}, sub=${selectedSub || '—'}.\n` +
        (qaPairs ? `Уточняющие:\n${qaPairs}\n` : '');

      const history: Msg[] = [
        { role: 'user', content: systemContext },
        ...messages.slice(-8), // последние реплики
      ];
      if (optionalUserMessage) {
        history.push({ role: 'user', content: optionalUserMessage });
      }

      const res = await fetch(`/api/assistant/ask${tgId ? `?id=${encodeURIComponent(tgId)}` : ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: optionalUserMessage ?? 'Сформируй разбор и шаги действий.', history }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        const err = data?.error || `HTTP_${res.status}`;
        setMessages((m) => [...m, { role: 'assistant', content: `Ошибка: ${err}. Попробуйте ещё раз.` }]);
      } else {
        setMessages((m) => [...m, { role: 'assistant', content: data.answer }]);
      }
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Сбой сети. Попробуйте ещё раз.' }]);
    } finally {
      setLoading(false);
    }
  }

  // Отправка из поля ввода
  function onSend() {
    const val = input.trim();
    if (!val) return;
    setInput('');
    void send(val);
  }

  // Кнопка «Назад»
  function goBack() {
    if (phase === 'sub') {
      // назад к корневым
      setPhase('root');
      setSelectedRoot('');
      setSelectedSub('');
      setFollowupIdx(0);
      setFollowupAnswers([]);
      setMessages([]);
      setContextTags([]);
      return;
    }

    if (phase === 'chat') {
      // если мы в режиме уточняющих вопросов и уже показан >= 1-й
      if (followupIdx > 0 && followupIdx <= followupQuestions.length) {
        // убрать текущий вопрос (асистент в конце)
        setMessages((m) => {
          const mm = [...m];
          // если последний ассистент — это текущий вопрос, удалим его
          const last = mm[mm.length - 1];
          if (last && last.role === 'assistant' && followupQuestions[followupIdx - 1] !== last.content) {
            // ничего
          }
          // чаще порядок: ... user answer (idx-1), assistant question (idx)
          // при back перед ответом удаляем последний ассистент-вопрос
          if (mm.length && mm[mm.length - 1]?.role === 'assistant') mm.pop();
          return mm;
        });
        setFollowupIdx((i) => Math.max(0, i - 1));
        // ответ на предыдущий вопрос можно оставить; пользователь его уже дал
        return;
      }

      // иначе выходим к списку подкатегорий
      setPhase('sub');
      setMessages([]);
      setFollowupIdx(0);
      setFollowupAnswers([]);
      return;
    }
  }

  return (
    <main style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center' }}>Юридический ассистент</h1>

      {/* Кнопка Назад (показываем везде, кроме root) */}
      {phase !== 'root' && (
        <div style={{ marginTop: 8 }}>
          <button onClick={goBack} className="list-btn" style={{ ...COMPACT_BTN_STYLE, maxWidth: 140 }}>
            ← Назад
          </button>
        </div>
      )}

      {/* Этап 1: категории */}
      {phase === 'root' && (
        <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          {ROOT_TOPICS.map((t) => (
            <button key={t.key} className="list-btn" onClick={() => startSub(t.key)} style={{ ...COMPACT_BTN_STYLE }}>
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
            <button key={s.key} className="list-btn" onClick={() => chooseSub(s.key)} style={{ ...COMPACT_BTN_STYLE }}>
              <span className="list-btn__left"><b>{s.label}</b></span>
              <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
            </button>
          ))}
        </div>
      )}

      {/* Этап 3: чат (в т.ч. последовательные уточняющие) */}
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
            {loading && <div style={{ opacity: .6, fontSize: 14 }}>Думаю…</div>}
          </div>

          <div style={{ padding: 10, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => (e.key === 'Enter' ? onSend() : null)}
                placeholder="Сообщение…"
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)',
                  background: 'transparent', color: 'inherit', outline: 'none', fontSize: 14
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
      )}

      <div style={{ height: 12 }} />
    </main>
  );
}
