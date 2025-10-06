'use client';

import Link from 'next/link';

function haptic(type: 'light' | 'medium' = 'light') {
  try { (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type); } catch {}
}

export default function AdminPaymentsPage() {
  return (
    <main className="safe" style={{ padding: 20, display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Link href="/cabinet/admin" className="list-btn" onClick={() => haptic('light')}
          style={{ width: 120, textDecoration: 'none' }}>
          ← Назад
        </Link>
        <h1 style={{ margin: 0 }}>Admin · Платежи</h1>
      </div>

      <p style={{ opacity: .8 }}>
        Заглушка раздела. Здесь отобразим успешные платежи, суммы, периоды, поиск, статусы подписок.
      </p>
    </main>
  );
}
