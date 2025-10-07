// components/GlobalSafeTop.tsx
'use client';

/**
 * Глобальный «безопасный верх» для Telegram Mini App.
 * Вставляет CSS, который добавляет отступ сверху на всех страницах.
 * Отступ = max(env(safe-area-inset-top), 56px).
 *
 * Подключается один раз в app/layout.tsx.
 */
export default function GlobalSafeTop() {
  return (
    <style jsx global>{`
      :root {
        --lm-header-offset: 56px; /* fallback для Android/desktop */
        --lm-safe-top: max(env(safe-area-inset-top), var(--lm-header-offset));
      }

      /* Добавляем «интимную зону» перед ВСЕМ контентом */
      body::before {
        content: '';
        display: block;
        height: var(--lm-safe-top);
      }

      /* На очень широких экранах можно немного уменьшить отступ */
      @media (min-width: 1024px) {
        :root { --lm-header-offset: 40px; }
      }
    `}</style>
  );
}
