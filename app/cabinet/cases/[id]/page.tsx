'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import sanitizeHtml from 'sanitize-html';

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
  status: string;
  createdAt: string;
  updatedAt: string;
  nextDueAt?: string | null;
};

const DEBUG = process.env.NEXT_PUBLIC_ALLOW_BROWSER_DEBUG === '1';

/* ---- компактный markdown + sane HTML ---- */
function mdLite(src?: string) {
  if (!src) return '';
  let s = src;
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  s = s.replace(/\*([^*\n]+)\*/g, '<i>$1</i>');
  s = s.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  s = s.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  s = s.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  const lines = s.split(/\r?\n/);
  let html = '';
  let inUl = false, inOl = false;
  const flush = () => { if (inUl) { html += '</ul>'; inUl = false; } if (inOl) { html += '</ol>'; inOl = false; } };
  for (const line of lines) {
    const mUl = line.match(/^\s*-\s+(.+)$/);
    const mOl = line.match(/^\s*\d+\.\s+(.+)$/);
    if (mUl) { if (!inUl) { flush(); html += '<ul>'; inUl = true; } html += `<li>${mUl[1]}</li>`; continue; }
    if (mOl) { if (!inOl) { flush(); html += '<ol>'; inOl = true; } html += `<li>${mOl[1]}</li>`; continue; }
    if (!line.trim()) { flush(); html += '<br/>'; continue; }
    flush(); html += `<p>${line}</p>`;
  }
  flush();
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1','h2','h3','ul','ol','li','b','i','p','br','a']),
    allowedAttributes: { a: ['href','target','rel'] },
  });
}

function getDebugIdFromUrl(): string | null {
  try {
    const u = new URL(window.location.href);
    const id = u.searchParams.get('id');
    return id && /^\d{3,15}$/.test(id) ? id : null;
  } catch { return null; }
}

export default function CasePage() {
  const { id: caseIdParam } = useParams();
  const caseId = String(caseIdParam || '');
  const router = useRouter();

  const [userInitData, setUserInitData] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<CaseData | null>(null);
  const [items, setItems] = useState<CaseItem[]>([]);
  const [expandedAnswers, setExpandedAnswers] = useState<Record<string, boolean>>({});

  const debugId = useMemo(() => (DEBUG ? getDebugIdFromUrl() : null), []);
  const authReady = Boolean(userInitData) || Boolean(debugId);

  const apiSuffix = useMemo(
    () => (userInitData ? '' : (debugId ? `?id=${encodeURIComponent(debugId)}` : '')),
    [userInitData, debugId]
  );
  const apiHeaders = useMemo<Record<string, string>>(() => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (userInitData) h['x-init-data'] = userInitData;
    return h;
  }, [userInitData]);

  // Telegram initData
  useEffect(() => {
    const WebApp: any = (window as any)?.Telegram?.WebApp;
    try { WebApp?.ready?.(); WebApp?.expand?.(); } catch {}
    const init = WebApp?.initData || '';
    if (init) setUserInitData(init);
  }, []);

  // загрузка
  async function loadAll() {
    if (!caseId) return;
    setLoading(true);
    setError(null);
    try {
      const r1 = await fetch(`/api/cases/${caseId}${apiSuffix}`, { method: 'GET', headers: apiHeaders });
      const d1 = await r1.json();
      if (!r1.ok || !d1?.ok) throw new Error(d1?.error || `HTTP_${r1.status}`);
      setData(d1.case as CaseData);

      const r2 = await fetch(`/api/cases/${caseId}/items${apiSuffix}`, { method: 'GET', headers: apiHeaders });
      const d2 = await r2.json();
      if (!r2.ok || !d2?.ok) throw new Error(d2?.error || `HTTP_${r2.status}`);

      // сразу не рендерим большие тела — они будут показаны только по клику
      const rawItems: CaseItem[] = (d2.items || []) as CaseItem[];
      setItems(rawItems);
    } catch (e: any) {
      setError(e?.message || 'Ошибка загрузки');
    } finally { setLoading(false); }
  }
  useEffect(() => { if (authReady) loadAll(); }, [caseId, authReady, apiSuffix, apiHeaders]);

  // добавление элемента
  const [newKind, setNewKind] = useState<'note' | 'step' | 'deadline' | 'doc'>('note');
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newDue, setNewDue] = useState('');

  async function addItem() {
    if (!newTitle.trim()) return;
    setSaving(true); setError(null);
    try {
      const body: any = { kind: newKind, title: newTitle.trim() };
      if (newBody.trim()) body.body = newBody.trim();
      if (newKind === 'deadline' && newDue) body.dueAt = new Date(`${newDue}T00:00:00`).toISOString();

      const r = await fetch(`/api/cases/${caseId}/items${apiSuffix}`, { method: 'POST', headers: apiHeaders, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok || !d?.ok) throw new Error(d?.error || `HTTP_${r.status}`);

      setItems((prev) => [d.item as CaseItem, ...prev]);
      setNewTitle(''); setNewBody(''); setNewDue(''); setNewKind('note');
    } catch (e: any) {
      setError(e?.message || 'Не удалось добавить элемент');
    } finally { setSaving(false); }
  }

  const fmt = (d?: string | null) => !d ? '' : new Date(d).toLocaleDateString();

  /* ---------- UI ---------- */
  const card = (children: any) => (
    <div
      style={{
        background: 'var(--panel, rgba(255,255,255,0.03))',
        border: '1px solid var(--border, #333)',
        borderRadius: 12,
        padding: 12,
        display: 'block',     // ВАЖНО: НЕ кнопка
        overflow: 'hidden'    // ничего не вылезает
      }}
    >
      {children}
    </div>
  );

  return (
    <div style={{ padding: 20, maxWidth: 820, margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center' }}>Дело</h1>

      <div style={{ marginTop: 8 }}>
        <button onClick={() => router.back()} className="list-btn" style={{ textDecoration: 'none', padding: '8px 12px', borderRadius: 10 }}>
          ← Назад
        </button>
      </div>

      {card(
        <>
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
        </>
      )}

      {card(
        <>
          <h3 style={{ marginTop: 0 }}>Добавить этап/заметку</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select value={newKind} onChange={(e) => setNewKind(e.target.value as any)}
                style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #333)', background: 'transparent', color: 'inherit' }}>
                <option value="note">Заметка</option>
                <option value="step">Шаг</option>
                <option value="deadline">Срок/дедлайн</option>
                <option value="doc">Документ</option>
              </select>
              {newKind === 'deadline' && (
                <input type="date" value={newDue} onChange={(e) => setNewDue(e.target.value)}
                  style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #333)', background: 'transparent', color: 'inherit' }} />
              )}
            </div>

            <input placeholder="Заголовок" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
              style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border, #333)', background: 'transparent', color: 'inherit' }} />

            <textarea placeholder="Описание (необязательно)" value={newBody} onChange={(e) => setNewBody(e.target.value)} rows={3}
              style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border, #333)', background: 'transparent', color: 'inherit', resize: 'vertical' }} />

            <div>
              <button disabled={saving || !newTitle.trim()} onClick={addItem} className="list-btn" style={{ padding: '8px 12px', borderRadius: 10 }}>
                {saving ? 'Сохраняем…' : 'Добавить'}
              </button>
            </div>
          </div>
        </>
      )}

      {card(
        <>
          <h3 style={{ marginTop: 0 }}>Таймлайн</h3>
          {!items.length && <p style={{ opacity: .7, marginBottom: 0 }}>Пока нет записей.</p>}

          <div style={{ display: 'grid', gap: 8 }}>
            {items.map((it) => {
              const isAnswer = it.title === 'Ответ ассистента';
              const expanded = expandedAnswers[it.id] === true;

              return (
                <div key={it.id}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border, #333)',
                    borderRadius: 12,
                    padding: 10,
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                        {it.title}{' '}
                        <span style={{ opacity: .6, fontWeight: 400 }}>
                          · {it.kind === 'deadline' ? 'Срок' : it.kind === 'step' ? 'Шаг' : it.kind === 'doc' ? 'Документ' : 'Заметка'}
                        </span>
                      </div>

                      {/* Тело: по кнопке для "Ответ ассистента" */}
                      {isAnswer ? (
                        !expanded ? (
                          <button
                            onClick={() => setExpandedAnswers(s => ({ ...s, [it.id]: true }))}
                            className="list-btn"
                            style={{ marginTop: 8, padding: '6px 10px', borderRadius: 8, fontSize: 13 }}
                          >
                            Показать ответ
                          </button>
                        ) : (
                          <>
                            <div
                              style={{ marginTop: 8, lineHeight: 1.5, fontSize: 14, wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                              dangerouslySetInnerHTML={{ __html: mdLite(it.body || '') }}
                            />
                            <button
                              onClick={() => setExpandedAnswers(s => ({ ...s, [it.id]: false }))}
                              className="list-btn"
                              style={{ marginTop: 8, padding: '6px 10px', borderRadius: 8, fontSize: 13 }}
                            >
                              Свернуть
                            </button>
                          </>
                        )
                      ) : (
                        it.body ? (
                          <div
                            style={{
                              opacity: .9,
                              marginTop: 4,
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              overflowWrap: 'anywhere'
                            }}
                          >
                            {it.body}
                          </div>
                        ) : null
                      )}
                    </div>

                    <div style={{ textAlign: 'right', minWidth: 120, opacity: .7 }}>
                      {it.dueAt ? <>до {fmt(it.dueAt)}<br/></> : null}
                      <span style={{ fontSize: 12 }}>создано {fmt(it.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
