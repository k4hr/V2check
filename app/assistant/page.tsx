'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Msg = { role: 'user' | 'assistant'; content: string };
type Phase = 'root' | 'sub' | 'followups' | 'freeinput' | 'chat';

// Верхние категории
const ROOT_TOPICS = [
  { key: 'labor', label: 'Трудовые вопросы' },
  { key: 'housing', label: 'Жильё и недвижимость' },
  { key: 'consumer', label: 'Права потребителей' },
  { key: 'family', label: 'Семейные вопросы' },
  { key: 'traffic', label: 'Штрафы и ДТП' },
  { key: 'other', label: 'Другое' },
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
  const [phase, setPhase] = useState<Phase>('root');
  const [selectedRoot, setSelectedRoot] = useState<string>('');
  const [contextTags, setContextTags] = useState<string[]>([]);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const [isPro, setIsPro] = useState<boolean>(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // ?id= из URL (как в /api/me?id=...)
  const tgId = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const u = new URL(window.location.href);
    return u.searchParams.get('id') || '';
  }, []);

  // Инициализация Telegram WebApp
  useEffect(() => {
    const w: any = window;
    try { w?.Telegram?.WebApp?.ready?.(); w?.Telegram?.WebApp?.expand?.(); } catch {}
  }, []);

useEffect(() => {
  (async () => {
    try {
      const w: any = window;
      const initData: string | undefined = w?.Telegram?.WebApp?.initData;

      const res = await fetch(`/api/me${tgId ? `?id=${encodeURIComponent(tgId)}` : ''}`, {
        method: 'POST',
        // ВАЖНО: отдаём initData, чтобы /api/me смог проверить HMAC
        headers: {
          'Content-Type': 'application/json',
          ...(initData ? { 'x-init-data': initData } : {}),
        },
        cache: 'no-store',
      });

      const data = await res.json();
      // если всё ок — отмечаем Pro
      setIsPro(Boolean(data?.subscription?.active));
    } catch {
      setIsPro(false);
    }
  })();
}, [tgId]);

  // Автоскролл чата
  useEffect(() => {
    boxRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' });
  }, [messages]);

  // Подкатегории
  const SUB_TOPICS: Record<string, { key: string; label: string }[]> = {
    labor: [
      { key: 'dismissal', label: 'Увольнение/сокращение' },
      { key: 'salary', label: 'Задержка зарплаты' },
      { key: 'contract', label: 'Трудовой договор' },
      { key: 'vacation', label: 'Отпуск/больничный' },
      { key: 'other', label: 'Другое' },
    ],
    housing: [
      { key: 'rent', label: 'Аренда/найм' },
      { key: 'purchase', label: 'Покупка/продажа' },
      { key: 'neighbors', label: 'Соседи/шум' },
      { key: 'utilities', label: 'Коммунальные/управляйка' },
      { key: 'other', label: 'Другое' },
    ],
    consumer: [
      { key: 'return', label: 'Возврат/обмен товара' },
      { key: 'service', label: 'Плохая услуга' },
      { key: 'online', label: 'Онлайн-покупка' },
      { key: 'warranty', label: 'Гарантия' },
      { key: 'other', label: 'Другое' },
    ],
    family: [
      { key: 'divorce', label: 'Развод' },
      { key: 'alimony', label: 'Алименты' },
      { key: 'children', label: 'Дети/опека' },
      { key: 'property', label: 'Имущество/брачный договор' },
      { key: 'other', label: 'Другое' },
    ],
    traffic: [
      { key: 'fine', label: 'Штраф' },
      { key: 'accident', label: 'ДТП' },
      { key: 'rights', label: 'Лишение прав' },
      { key: 'osago', label: 'ОСАГО/КАСКО' },
      { key: 'other', label: 'Другое' },
    ],
  };

  // Уточняющие вопросы
  const FOLLOWUPS: Record<string, Record<string, string[]>> = {
    labor: {
      dismissal: ['Инициатор увольнения?', 'Есть приказ/уведомление?', 'Дата события?'],
      salary: ['Срок задержки?', 'Есть трудовой договор?', 'Платят частично или вовсе нет?'],
      contract: ['Подписан ли договор?', 'Есть допсоглашения?', 'Какой график/ставка?'],
      vacation: ['Тип отпуска/больничного?', 'Отказали или задерживают оплату?', 'Документы прилагались?'],
      other: ['Опишите кратко проблему.'],
    },
    housing: {
      rent: ['Вы арендодатель или наниматель?', 'Есть договор?', 'Какой спор возник?'],
      purchase: ['Тип сделки?', 'Есть расписка/ДКП?', 'Стадия сейчас?'],
      neighbors: ['Характер проблемы?', 'Обращались в УК/полицию?', 'Доказательства есть?'],
      utilities: ['Что именно не так?', 'Проблема сколько длится?', 'Обращались ли в УК?'],
      other: ['Опишите кратко проблему.'],
    },
    consumer: {
      return: ['Когда купили?', 'Чек/документы есть?', 'Продавец отказал?'],
      service: ['Какая услуга?', 'Договор/акт есть?', 'В чём нарушение?'],
      online: ['Маркетплейс/сайт?', 'Статус заказа?', 'Переписка/доказательства есть?'],
      warranty: ['Срок эксплуатации?', 'Диагностика была?', 'Отказ по гарантии?'],
      other: ['Опишите кратко проблему.'],
    },
    family: {
      divorce: ['Есть дети?', 'Согласие сторон?', 'Имущественные споры?'],
      alimony: ['Есть решение/соглашение?', 'Сумма/процент?', 'Есть задолженность?'],
      children: ['Опека/место жительства/порядок общения?', 'Идёт ли суд сейчас?'],
      property: ['Есть брачный договор?', 'Что делите?', 'Добрачное/совместно нажитое?'],
      other: ['Опишите кратко проблему.'],
    },
    traffic: {
      fine: ['Статья/вид штрафа?', 'Когда получено постановление?', 'Срок обжалования не прошёл?'],
      accident: ['Есть схема/справка?', 'Кто виновник по версии ГИБДД?', 'Есть ОСАГО у сторон?'],
      rights: ['Статья лишения?', 'Когда составлен протокол?', 'Срок рассмотрения идёт?'],
      osago: ['Какая страховая?', 'Что произошло?', 'Что подано уже?'],
      other: ['Опишите кратко проблему.'],
    },
  };

  function pushTag(tag: string) {
    setContextTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]));
  }

  function startSub(rootKey: string) {
    setSelectedRoot(rootKey);
    pushTag(`root:${rootKey}`);
    if (SUB_TOPICS[rootKey]?.length) setPhase('sub');
    else setPhase('freeinput');
  }

  function chooseSub(subKey: string) {
    pushTag(`sub:${subKey}`);
    if (FOLLOWUPS[selectedRoot]?.[subKey]?.length) setPhase('followups');
    else setPhase('freeinput');
  }

  // PAYWALL перед ответом (если нет Pro)
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
    setPhase('chat');
  }

  async function sendToAI(text: string) {
    const prompt = text.trim();
    if (!prompt || loading) return;

    // Сначала фиксируем сообщение пользователя в чате
    setMessages((m) => [...m, { role: 'user', content: prompt }]);

    // Если нет подписки — не ходим в API, сразу показываем paywall
    if (!isPro) {
      showPaywall();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/assistant/ask${tgId ? `?id=${encodeURIComponent(tgId)}` : ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          history: [
            { role: 'user', content: `Категории: ${contextTags.join(', ') || 'не выбраны'}` },
            ...messages.slice(-6),
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        const err = data?.error || `HTTP_${res.status}`;
        setMessages((m) => [
          ...m,
          { role: 'assistant', content: `Ошибка: ${err}. Попробуйте ещё раз.` },
        ]);
      } else {
        setMessages((m) => [...m, { role: 'assistant', content: data.answer }]);
      }
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Сбой сети. Попробуйте ещё раз.' }]);
    } finally {
      setLoading(false);
      setPhase('chat');
    }
  }

  function handleFreeSubmit() {
    const val = input.trim();
    if (!val) return;
    setInput('');
    sendToAI(val);
  }

  return (
    <main style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center' }}>Юридический ассистент</h1>

      {/* === Этап 1: категории === */}
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

      {/* === Этап 2: подкатегории === */}
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

      {/* === Этап 3: уточняющие вопросы (как кнопки-переход к вводу) === */}
      {phase === 'followups' && (
        <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          {(FOLLOWUPS[selectedRoot] &&
            FOLLOWUPS[selectedRoot][contextTags.find((t) => t.startsWith('sub:'))?.split(':')[1] || 'other'])?.map(
            (q, idx) => (
              <button
                key={idx}
                className="list-btn"
                onClick={() => {
                  // Подталкиваем пользователя к свободному вводу (кнопка задаёт тон)
                  setMessages((m) => [...m, { role: 'assistant', content: q }]);
                  setPhase('freeinput');
                }}
                style={{ ...COMPACT_BTN_STYLE }}
              >
                <span className="list-btn__left">{q}</span>
                <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
              </button>
            )
          )}
          <button
            className="list-btn"
            onClick={() => setPhase('freeinput')}
            style={{ ...COMPACT_BTN_STYLE }}
          >
            <span className="list-btn__left"><b>Другое</b></span>
            <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
          </button>
        </div>
      )}

      {/* === Этап 4: свободный ввод до старта чата === */}
      {phase === 'freeinput' && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => (e.key === 'Enter' ? handleFreeSubmit() : null)}
              placeholder="Коротко опишите проблему…"
              style={{
                flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)',
                background: 'transparent', color: 'inherit', outline: 'none', fontSize: 14
              }}
            />
            <button
              onClick={handleFreeSubmit}
              disabled={!input.trim()}
              className="list-btn"
              style={{ padding: '0 16px' }}
            >
              Далее
            </button>
          </div>
        </div>
      )}

      {/* === Этап 5: чат === */}
      {(phase === 'chat' || messages.length > 0) && (
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
                onKeyDown={(e) => (e.key === 'Enter' ? sendToAI(input) : null)}
                placeholder="Сообщение…"
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)',
                  background: 'transparent', color: 'inherit', outline: 'none', fontSize: 14
                }}
              />
              <button
                onClick={() => { const v = input.trim(); if (v) { setInput(''); sendToAI(v); } }}
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
