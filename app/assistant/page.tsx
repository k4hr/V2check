'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function AssistantPage() {
  useEffect(() => {
    const w: any = window;
    w?.Telegram?.WebApp?.ready?.();
    w?.Telegram?.WebApp?.expand?.();
  }, []);

  return (
    <main style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center' }}>Юридический ассистент</h1>

      <div style={{
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        border: '1px solid var(--border)',
        background: 'var(--panel)'
      }}>
        <p style={{ opacity: .8 }}>
          Здесь будет чат с ИИ-помощником: задайте вопрос — получите разбор и пошаговые действия.
        </p>

        <ul style={{ marginTop: 12, opacity: .8 }}>
          <li>• Бесплатно: N ответов в день</li>
          <li>• Pro: безлимитные ответы и расширенные разъяснения</li>
        </ul>

        <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
          <Link href="/pro" className="list-btn" style={{ textDecoration: 'none' }}>
            <span className="list-btn__left">
              <span className="list-btn__emoji">⭐</span>
              <b>Оформить Pro</b>
            </span>
            <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
          </Link>

          <Link href="/" className="list-btn" style={{ textDecoration: 'none' }}>
            <span className="list-btn__left">
              <span className="list-btn__emoji">🏠</span>
              <b>На главную</b>
            </span>
            <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
          </Link>
        </div>
      </div>
    </main>
  );
}
