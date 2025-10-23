/* path: app/info/support/page.tsx */
import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import BackBtn from '@/components/BackBtn';

export const metadata: Metadata = {
  title: 'Поддержка — LiveManager',
  description: 'Как связаться с поддержкой и решить вопрос по LiveManager',
};

export default function SupportPage() {
  return (
    <main className="lm-page" style={{ maxWidth: 760 }}>
      <div style={{ position: 'relative', marginBottom: 6 }}>
        <BackBtn fallback="/cabinet" />
      </div>

      <h1>Поддержка</h1>
      <p className="lm-subtitle">
        Мы стараемся отвечать быстро. Обычно — в течение 1–2 рабочих дней.
      </p>

      <div
        style={{
          border: '1px solid var(--card-border)',
          borderRadius: 16,
          padding: 16,
          background: 'var(--card-bg)',
          boxShadow: 'var(--shadow)',
        }}
      >
        <h3 style={{ marginTop: 0 }}>Как с нами связаться</h3>
        <ul>
          <li>
            Email: <a href="mailto:support@seimngr">support@seimngr</a>
          </li>
          <li>
            Вопросы по оплате/подписке: укажите ID аккаунта (Telegram/VK) и
            номер транзакции провайдера.
          </li>
          <li>
            Правовые документы:{' '}
            <Link href="/info/offer">Оферта</Link> ·{' '}
            <Link href="/info/privacy">Политика конфиденциальности</Link>
          </li>
        </ul>

        <h3>Что приложить к обращению</h3>
        <ul>
          <li>краткое описание проблемы и шаги для воспроизведения;</li>
          <li>скриншоты/экранные записи (если есть);</li>
          <li>ID пользователя (Telegram/VK) и время возникновения проблемы.</li>
        </ul>
      </div>

      <p style={{ marginTop: 24, opacity: 0.8 }}>
        Если вопрос срочный (оплата/доступ), напишите в теме письма
        <i> «URGENT»</i> — такие обращения обрабатываются в приоритете.
      </p>
    </main>
  );
}
