'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type CaseItem = {
  id: string;
  kind: 'note' | 'step' | 'deadline' | 'doc' | string;
  title: string;
  body?: string | null;
  dueAt?: string | null;
  done: boolean;
  priority?: number | null;
  createdAt: string;
};

type CaseData = {
  id: string;
  title: string;
  status: string;           // active | closed | archived
  createdAt: string;
  updatedAt: string;
  nextDueAt?: string | null;
  items?: CaseItem[];
};

const DEBUG = process.env.NEXT_PUBLIC_ALLOW_BROWSER_DEBUG === '1';

/* ---------------- Markdown (лайт-рендер без новых зависимостей) --------------- */
import sanitizeHtml from 'sanitize-html';

function mdLite(src?: string) {
  if (!src) return '';
  let s = src;

  // ссылки: [текст](url)
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // жирный и курсив
  s = s.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  s = s.replace(/\*([^*\n]+)\*/g, '<i>$1</i>');

  // заголовки
  s = s.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  s = s.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  s = s.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // списки
  const lines = s.split(/\r?\n/);
  let html = '';
  let inUl = false;
  let inOl = false;
  const flushLists = () => {
    if (inUl) { html += '</ul>'; inUl = false; }
    if (inOl) { html += '</ol>'; inOl = false; }
  };

  for (const line of lines) {
    const mUl = line.match(/^\s*-\s+(.+)$/);
    const mOl = line.match(/^\s*\d+\.\s+(.+)$/);

    if (mUl) {
      if (!inUl) { flushLists(); html += '<ul>'; inUl = true; }
      html += `<li>${mUl[1]}</li>`;
      continue;
    }
    if (mOl) {
      if (!inOl) { flushLists(); html += '<ol>'; inOl = true; }
      html += `<li>${mOl[1]}</li>`;
      continue;
    }

    if (line.trim() === '') {
      flushLists();
      html += '<br/>';
      continue;
    }

    flushLists();
    html += `<p>${line}</p>`;
  }
  flushLists();

  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1','h2','h3','ul','ol','li','b','i','p','br','a']),
    allowedAttributes: { a: ['href','target','rel'] },
  });
}

/* --------------------------------- utils ------------------------------------- */

function getDebugIdFromUrl(): string | null {
  try {
    const u = new URL(window.location.href);
    const id = u.searchParams.get('id');
    if (id && /^\d{3,15}$/.test(id)) return id;
    return null;
  } catch {
    return null;
  }
}

export default function CasePage() {
  const params = useParams();
  const router = useRouter();
  const caseId = String(params?.id || '');

  const [userInitData, setUserInitData] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<CaseData | null>(null);
  const [items, setItems] = useState<CaseItem[]>([]);
  const [expandAnswer, setExpandAnswer] = useState(false); // сворачивание «Ответ ассистента»

  // query-суффикс и заголовки для API
  const apiSuffix = useMemo(() => {
    if (userInitData) return ''; // есть Telegram initData — хедер пойдёт, суффикс не нужен
    if (DEBUG) {
      const dbg = getDebugIdFromUrl();
      if (dbg) return `?id=${encodeURIComponent(dbg)}`;
    }
    return '';
  }, [userInitData]);

  const apiHeaders = useMemo<Record<string, string>>(() => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (userInitData) h['x-init-data'] = userInitData;
    return h;
  }, [userInitData]);

  // Telegram WebApp initData (если открыто из TWA)
  useEffect(() => {
    const WebApp: any = (window as any)?.Telegram?.WebApp;
    try { WebApp?.ready?.(); WebApp?.expand?.(); } catch {}
    const initData = WebApp?.initData || '';
    if (initData) setUserInitData(initData);
  }, []);

  // загрузка дела + элементов
  async function loadAll() {
    if (!caseId) return;
    setLoading(true);
    setError(null);
    try {
      // дело
      const r1 = await fetch(`/api/cases/${caseId}${apiSuffix}`, { method: 'GET', headers: apiHeaders });
      const d1 = await r1.json();
      if (!r1.ok || !d1?.ok) throw new Error(d1?.error || `HTTP_${r1.status}`);
      setData(d1.case as CaseData);

      // элементы
      const r2 = await fetch(`/api/cases/${caseId}/items${apiSuffix}`, { method: 'GET', headers: apiHeaders });
      const d2 = await r2.json();
      if (!r2.ok || !d2?.ok) throw new Error(d2?.error || `HTTP_${r2.status}`);
      setItems((d2.items || []) as CaseItem[]);
    } catch (e: any) {
      setError(e?.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, apiSuffix, apiHeaders]);

  // добавить элемент
  const [newKind, setNewKind] = useState<'note' | 'step' | 'deadline' | 'doc'>('note');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newBody, setNewBody] = useState<string>('');
  const [newDue, setNewDue] = useState<string>(''); // 'YYYY-MM-DD'

  async function addItem() {
    if (!newTitle.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const body: any = { kind: newKind, title: newTitle.trim() };
      if (newBody.trim()) body.body = newBody.trim();
      if (newKind === 'deadline' && newDue) {
        // дата в ISO (полночь по локали)
        body.dueAt = new Date(`${newDue}T00:00:00`).toISOString();
      }
      const r = await fetch(`/api/cases/${caseId}/items${apiSuffix}`, {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok || !d?.ok) throw new Error(d?.error || `HTTP_${r.status}`);

      // оптимистично обновим список
      setItems((prev) => [d.item as CaseItem, ...prev]);
      // очистим форму
      setNewTitle('');
      setNewBody('');
      setNewDue('');
      setNewKind('note');
    } catch (e: any) {
      setError(e?.message || 'Не удалось добавить элемент');
    } finally {
      setSaving(false);
    }
  }

  // форматы
  function fmt(d?: string | null): string {
    if (!d) return '';
    const x = new Date(d);
    const dd = String(x.getDate()).padStart(2, '0');
    const mm = String(x.getMonth() + 1).padStart(2, '0');
    const yyyy = x.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  }

  /* ------------------------------ UI ----------------------------------------- */

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ textAlign: 'center' }}>Дело</h1>

      {/* Главный стек секций (никаких marginTop — только gap) */}
      <div style={{ display: 'grid', gap: 12, maxWidth: 820, marginInline: 'auto' }}>
        {/* Навигация */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => router.back()} className="list-btn" style={{ textDecoration: 'none', padding: '8px 12px', borderRadius: 10 }}>
            ← Назад
          </button>
          {/* используем обычную ссылку, чтобы не бодаться с typedRoutes */}
          <a href="/cabinet/cases" className="list-btn" style={{ textDecoration: 'none', padding: '8px 12px', borderRadius: 10 }}>
            В кабинет
          </a>
        </div>

        {/* Карточка с общей информацией по делу */}
        <section style={{ border: '1px solid #333', borderRadius: 12, padding: 12 }}>
          {loading && <p style={{ opacity: .7, margin: 0 }}>Загружаем…</p>}
          {error && <p style={{ color: 'tomato', margin: 0 }}>Ошибка: {error}</p>}

          {data && (
            <>
              <h3 style={{ margin: '8px 0' }}>{data.title}</h3>
              <p style={{ margin: '6px 0', opacity: .85 }}>
                Статус: <b>{data.status}</b>
                {data.nextDueAt ? <> · Ближайший срок: <b>{fmt(data.nextDueAt)}</b></> : null}
              </p>
              <p style={{ margin: '6px 0', opacity: .7 }}>
                Создано: {fmt(data.createdAt)} · Обновлено: {fmt(data.updatedAt)}
              </p>
            </>
          )}
        </section>

        {/* Добавить элемент таймлайна */}
        <section style={{ border: '1px solid #333', borderRadius: 12, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Добавить этап/заметку</h3>

          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select value={newKind} onChange={(e) => setNewKind(e.target.value as any)}
                      style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #333)', background: 'transparent', color: 'inherit' }}>
                <option value="note">Заметка</option>
                <option value="step">Шаг</option>
                <option value="deadline">Срок/дедлайн</option>
                <option value="doc">Документ</option>
              </select>

              {newKind === 'deadline' && (
                <input
                  type="date"
                  value={newDue}
                  onChange={(e) => setNewDue(e.target.value)}
                  style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #333)', background: 'transparent', color: 'inherit' }}
                />
              )}
            </div>

            <input
              placeholder="Заголовок"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border, #333)', background: 'transparent', color: 'inherit' }}
            />

            <textarea
              placeholder="Описание (необязательно)"
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              rows={3}
              style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border, #333)', background: 'transparent', color: 'inherit', resize: 'vertical' }}
            />

            <div>
              <button
                disabled={saving || !newTitle.trim()}
                onClick={addItem}
                className="list-btn"
                style={{ padding: '8px 12px', borderRadius: 10 }}
              >
                {saving ? 'Сохраняем…' : 'Добавить'}
              </button>
            </div>
          </div>
        </section>

        {/* Таймлайн */}
        <section style={{ border: '1px solid #333', borderRadius: 12, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Таймлайн</h3>

          {!items.length && <p style={{ opacity: .7 }}>Пока нет записей.</p>}

          <div style={{ display: 'grid', gap: 8 }}>
            {items.map((it) => (
              <div key={it.id} className="list-btn" style={{ textAlign: 'left', padding: '8px 12px', borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600 }}>
                      {it.title}{' '}
                      <span style={{ opacity: .6, fontWeight: 400 }}>
                        · {it.kind === 'deadline' ? 'Срок' : it.kind === 'step' ? 'Шаг' : it.kind === 'doc' ? 'Документ' : 'Заметка'}
                      </span>
                    </div>

                    {/* Контент карточки */}
                    {it.body ? (
                      it.title === 'Ответ ассистента' ? (
                        <>
                          <div
                            style={{
                              opacity: .95,
                              marginTop: 6,
                              maxHeight: expandAnswer ? 'none' : 260,
                              overflow: 'hidden'
                            }}
                            // безопасный HTML после санитайза
                            dangerouslySetInnerHTML={{ __html: mdLite(it.body) }}
                          />
                          {it.body.length > 600 && (
                            <button
                              onClick={() => setExpandAnswer(s => !s)}
                              className="list-btn"
                              style={{ marginTop: 8, padding: '6px 10px', borderRadius: 8, fontSize: 13 }}
                            >
                              {expandAnswer ? 'Свернуть' : 'Показать полностью'}
                            </button>
                          )}
                        </>
                      ) : (
                        <div style={{ opacity: .85, whiteSpace: 'pre-wrap', marginTop: 4 }}>{it.body}</div>
                      )
                    ) : null}
                  </div>

                  <div style={{ textAlign: 'right', minWidth: 120, opacity: .7 }}>
                    {it.dueAt ? <>до {fmt(it.dueAt)}<br/></> : null}
                    <span style={{ fontSize: 12 }}>создано {fmt(it.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
