'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import TopBar from '../../components/TopBar';
import { isFav, toggleFav } from '../../lib/favorites';

type Law = { id: string; title: string; updated_at: string; category: string };

export default function DocPage() {
  const params = useParams() as { id?: string };
  const id = decodeURIComponent(String(params?.id || ''));

  const [html, setHtml] = useState<string>('<p>Загрузка…</p>');
  const [fav, setFav] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;

    // 1) грузим документ
    fetch(`/content/laws/${encodeURIComponent(id)}.html`)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error('Документ не найден'))))
      .then(setHtml)
      .catch(() => setHtml('<p>Документ не найден</p>'));

    // 2) узнаём избранное асинхронно
    (async () => {
      try {
        const v = await isFav(id);
        setFav(!!v);
      } catch {
        setFav(false);
      }
    })();
  }, [id]);

  const onFav = useCallback(async () => {
    if (!id || busy) return;
    setBusy(true);
    try {
      await toggleFav(id);
      const v = await isFav(id);
      setFav(!!v);
    } catch {
      // молча игнорим, UI не меняем
    } finally {
      setBusy(false);
    }
  }, [id, busy]);

  return (
    <main style={{ padding: 12 }}>
      <TopBar
        title="Документ"
        right={
          <button
            type="button"
            onClick={onFav}
            disabled={busy}
            aria-label={fav ? 'Убрать из избранного' : 'В избранное'}
            className="icon-btn"
            style={{ opacity: busy ? 0.6 : 1 }}
          >
            {fav ? '★' : '☆'}
          </button>
        }
      />
      <article
        className="doc"
        dangerouslySetInnerHTML={{ __html: html }}
        style={{ marginTop: 8 }}
      />
    </main>
  );
}
