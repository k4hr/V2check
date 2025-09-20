'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

type Msg = { role: 'user' | 'assistant'; content: string };
type Phase = 'root' | 'sub' | 'followups' | 'freeinput' | 'chat';

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
const WRAP_BTN_CLASS = 'list-btn';

// Темы → подтемы → уточняющие вопросы
const TOPICS = [
  {
    key: 'labor',
    title: 'Трудовые вопросы',
    items: [
      { key: 'dismissal', title: 'Увольнение / сокращение' },
      { key: 'salary', title: 'Задержка зарплаты' },
      { key: 'contract', title: 'Трудовой договор / ГПХ' },
      { key: 'vacation', title: 'Отпуск / больничный' },
    ],
    followups: {
      dismissal: [
        'Какое основание увольнения указал работодатель?',
        'Были ли дисциплинарные взыскания?',
        'Вы подписали уведомление/приказ?',
        'Получили ли расчёт и трудовую книжку?',
      ],
      salary: [
        'Сколько дней длится задержка?',
        'Есть ли часть «в конверте»?',
        'Формально вы трудоустроены?',
        'Есть ли переписка/табели/графики?',
      ],
      contract: [
        'Какой тип договора у вас сейчас?',
        'Есть ли испытательный срок и сколько?',
        'Какие обязанности прописаны?',
      ],
      vacation: [
        'Сколько дней неиспользованного отпуска?',
        'Отпуск согласовывался письменно?',
        'Есть график отпусков на предприятии?',
      ],
    } as Record<string, string[]>,
  },
  {
    key: 'housing',
    title: 'Жильё и недвижимость',
    items: [
      { key: 'rent', title: 'Аренда / залог / выселение' },
      { key: 'purchase', title: 'Купля-продажа / регистрация' },
      { key: 'hoa', title: 'ЖКХ / УК / ТСЖ' },
      { key: 'neighbors', title: 'Споры с соседями' },
    ],
    followups: {
      rent: [
        'Есть ли письменный договор аренды?',
        'Как вносились платежи (квитанции/переводы)?',
        'Причина спора: залог, выселение, порча, другое?',
      ],
      purchase: [
        'Объект в ипотеке или нет?',
        'Есть задаток/аванс? Оформлялся распиской?',
        'На какой стадии сделка/регистрация?',
      ],
      hoa: [
        'Что именно оспариваете: начисления, отключение, доступ к данным?',
        'Есть ли акты/претензии/ответы УК?',
      ],
      neighbors: [
        'Суть конфликта: шум, затопление, границы, другое?',
        'Фиксировались ли доказательства (видео/свидетели/акты)?',
      ],
    } as Record<string, string[]>,
  },
  {
    key: 'consumer',
    title: 'Права потребителей',
    items: [
      { key: 'return', title: 'Возврат/обмен товара' },
      { key: 'services', title: 'Неоказанные/плохие услуги' },
      { key: 'online', title: 'Интернет-магазины / маркетплейсы' },
    ],
    followups: {
      return: [
        'Сколько прошло времени с покупки?',
        'Есть ли чек/заказ/накладная?',
        'Причина возврата: брак/не подошло/иное?',
      ],
      services: [
        'Что за услуга и когда должна была быть оказана?',
        'Есть договор/акт/переписка?',
      ],
      online: [
        'Площадка/магазин?',
        'Спор с продавцом, службой доставки или площадкой?',
      ],
    } as Record<string, string[]>,
  },
  {
    key: 'family',
    title: 'Семейные и алименты',
    items: [
      { key: 'divorce', title: 'Развод / раздел имущества' },
      { key: 'alimony', title: 'Алименты / порядок общения' },
      { key: 'guardianship', title: 'Опека / усыновление' },
    ],
    followups: {
      divorce: [
        'Есть ли общие несовершеннолетние дети?',
        'Есть брачный договор?',
        'Имущество оформлено на кого?',
      ],
      alimony: [
        'Есть ли уже решение/соглашение?',
        'Сколько детей и их возраст?',
      ],
      guardianship: [
        'Статус ребёнка/подопечного сейчас?',
        'Органы опеки уже вовлечены?',
      ],
    } as Record<string, string[]>,
  },
  {
    key: 'traffic',
    title: 'Штрафы и ДТП',
    items: [
      { key: 'fines', title: 'Штрафы ГИБДД' },
      { key: 'accident', title: 'ДТП / ОСАГО / КАСКО' },
      { key: 'rights', title: 'Лишение/ограничение прав' },
    ],
    followups: {
      fines: [
        'Дата и состав нарушения?',
        'Есть фото/видео-фиксация?',
        'Срок обжалования не пропущен?',
      ],
      accident: [
        'Оформление: европротокол или ГИБДД?',
        'Есть ли полис ОСАГО/КАСКО и у кого?',
        'Страховая уже дала ответ?',
      ],
      rights: [
        'Основание лишения/ограничения?',
        'Решение суда уже есть?',
      ],
    } as Record<string, string[]>,
  },
];

function Intro({ duplicate = false }: { duplicate?: boolean }) {
  return (
    <div style={{
      marginTop: duplicate ? 8 : 16,
      padding: 14,
      borderRadius: 12,
      border: '1px solid var(--border)',
      background: 'var(--panel)',
      fontSize: 14,
      lineHeight: 1.5,
    }}>
      Задайте вопрос — получите разбор и пошаговые действия.
      <ul style={{ marginTop: 8 }}>
        <li>• Бесплатно: {Number(process.env.NEXT_PUBLIC_FREE_QA_PER_DAY || 2)} ответ(а) в день</li>
        <li>• Pro: безлимитные ответы и расширенные разъяснения</li>
      </ul>
    </div>
  );
}

export default function AssistantPage() {
  const [phase, setPhase] = useState<Phase>('root');
  const [selTopic, setSelTopic] = useState<{ key: string; title: string } | null>(null);
  const [selSub, setSelSub] = useState<{ key: string; title: string } | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const tgId = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const u = new URL(window.location.href);
    return u.searchParams.get('id') || '';
  }, []);

  useEffect(() => {
    const w: any = window;
    w?.Telegram?.WebApp?.ready?.();
    w?.Telegram?.WebApp?.expand?.();
  }, []);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' });
  }, [messages, phase]);

  function buildContextHeader() {
    const parts: string[] = [];
    if (selTopic) parts.push(`Категория: ${selTopic.title}`);
    if (selSub) parts.push(`Ситуация: ${selSub.title}`);
    if (answers.length) parts.push(`Уточнения: ${answers.map((v, i) => `${i + 1}) ${v}`).join('; ')}`);
    return parts.join('\n');
  }

  async function send(promptPlain?: string) {
    const userText = (promptPlain ?? input).trim();
    if (!userText || loading) return;

    setInput('');
    setMessages((m) => [...m, { role: 'user', content: userText }]);
    setLoading(true);

    try {
      const res = await fetch(`/api/assistant/ask${tgId ? `?id=${encodeURIComponent(tgId)}` : ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${buildContextHeader()}\n\nВопрос пользователя: ${userText}`,
          history: messages.slice(-6),
        }),
      });
      const data = await res.json();

      if (!res.ok || !data?.ok) {
        const err = data?.error || `HTTP_${res.status}`;
        setMessages((m) => [
          ...m,
          {
            role: 'assistant',
            content:
              err === 'FREE_LIMIT_REACHED'
                ? 'Лимит бесплатных ответов на сегодня исчерпан. Оформите Pro для безлимита.'
                : `Ошибка: ${err}`,
          },
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

  function Btn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
    return (
      <button onClick={onClick} className={WRAP_BTN_CLASS} style={{ ...COMPACT_BTN_STYLE }}>
        {children}
        <span style={{ float: 'right', opacity: 0.6 }}>›</span>
      </button>
    );
  }

  function renderPhase(): React.ReactNode {
    if (phase === 'root') {
      return (
        <>
          <Intro />
          <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
            {TOPICS.map((t) => (
              <Btn key={t.key} onClick={() => { setSelTopic({ key: t.key, title: t.title }); setPhase('sub'); }}>
                {t.title}
              </Btn>
            ))}
            <Btn onClick={() => { setSelTopic(null); setSelSub(null); setAnswers([]); setPhase('freeinput'); }}>
              Другое
            </Btn>
          </div>
        </>
      );
    }

    if (phase === 'sub' && selTopic) {
      const current = TOPICS.find((x) => x.key === selTopic.key)!;
      return (
        <>
          <Intro duplicate />
          <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
            {current.items.map((it) => (
              <Btn key={it.key} onClick={() => { setSelSub({ key: it.key, title: it.title }); setPhase('followups'); }}>
                {it.title}
              </Btn>
            ))}
            <Btn onClick={() => { setSelSub(null); setAnswers([]); setPhase('freeinput'); }}>Другое</Btn>
          </div>
        </>
      );
    }

    if (phase === 'followups' && selTopic && selSub) {
      const current = TOPICS.find((x) => x.key === selTopic.key)!;
      const list = (current.followups?.[selSub.key] || []).slice(0, 5);
      return (
        <>
          <div style={{ marginTop: 12, fontSize: 14, opacity: 0.85 }}>
            Уточним детали по теме «{selSub.title}». Ответьте на вопросы (по желанию), затем опишите свою ситуацию.
          </div>
          <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
            {list.map((q, idx) => (
              <div key={idx} style={{ display: 'grid', gap: 6 }}>
                <div style={{ fontSize: 13, opacity: 0.8 }}>{q}</div>
                <input
                  placeholder="Ваш ответ…"
                  value={answers[idx] ?? ''}
                  onChange={(e) => {
                    const cp = answers.slice();
                    cp[idx] = e.target.value;
                    setAnswers(cp);
                  }}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    background: 'transparent',
                    color: 'inherit',
                    padding: '8px 10px',
                    fontSize: 14,
                  }}
                />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className={WRAP_BTN_CLASS} style={{ ...COMPACT_BTN_STYLE }} onClick={() => setPhase('freeinput')}>
              Перейти к описанию ситуации
            </button>
            <button
              className={WRAP_BTN_CLASS}
              style={{ ...COMPACT_BTN_STYLE }}
              onClick={() => { setSelTopic(null); setSelSub(null); setAnswers([]); setPhase('root'); }}
            >
              Сбросить и начать заново
            </button>
          </div>
        </>
      );
    }

    if (phase === 'freeinput') {
      return (
        <>
          <div style={{ marginTop: 12, fontSize: 14, opacity: 0.85 }}>
            Опишите вашу ситуацию своими словами. Мы уже учтём выбранные вами пункты (если были).
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => (e.key === 'Enter' ? send() : null)}
              placeholder="Опишите вашу ситуацию…"
              style={{
                flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)',
                background: 'transparent', color: 'inherit', outline: 'none', fontSize: 14,
              }}
            />
            <button onClick={() => send()} disabled={loading || !input.trim()} className={WRAP_BTN_CLASS} style={{ padding: '0 14px', fontSize: 14 }}>
              Отправить
            </button>
          </div>
        </>
      );
    }

    // ЧАТ
    return (
      <>
        <div ref={boxRef} style={{ padding: 8, overflowY: 'auto', flex: 1 }}>
          {messages.length === 0 ? (
            <div style={{ opacity: 0.8, fontSize: 14 }}>Диалог ещё не начат. Опишите вашу ситуацию ниже.</div>
          ) : (
            messages.map((m, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ opacity: 0.6, fontSize: 12, marginBottom: 4 }}>
                  {m.role === 'user' ? 'Вы' : 'Ассистент'}
                </div>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.45, fontSize: 14 }}>{m.content}</div>
              </div>
            ))
          )}
          {loading && <div style={{ opacity: 0.6, fontSize: 14 }}>Думаю…</div>}
        </div>
        <div style={{ padding: 10, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => (e.key === 'Enter' ? send() : null)}
              placeholder="Сообщение…"
              style={{
                flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)',
                background: 'transparent', color: 'inherit', outline: 'none', fontSize: 14,
              }}
            />
            <button onClick={() => send()} disabled={loading || !input.trim()} className={WRAP_BTN_CLASS} style={{ padding: '0 14px', fontSize: 14 }}>
              Отправить
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <main style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center' }}>Юридический ассистент</h1>
      <div style={{
        marginTop: 12,
        padding: 0,
        borderRadius: 12,
        border: '1px solid var(--border)',
        background: 'var(--panel)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: phase === 'chat' ? '65vh' : 'auto',
      }}>
        <div style={{ padding: 12 }}>
          {renderPhase()}
        </div>
      </div>
    </main>
  );
}
