'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function LegalFooter({ force = false }: { force?: boolean }) {
  const pathname = usePathname();
  const show = force || (pathname?.startsWith('/cabinet') ?? false);
  if (!show) return null;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 4px)',
          display: 'flex',
          justifyContent: 'center',
          gap: 10,
          fontSize: 12,
          lineHeight: 1,
          opacity: 0.35,            // «еле-еле видно»
          color: 'var(--text)',
          zIndex: 2,
          pointerEvents: 'none',     // контейнер клики не ловит
          userSelect: 'none',
        }}
        aria-hidden={false}
      >
        <Link
          href="/info/offer"
          style={{ pointerEvents: 'auto', color: 'inherit', textDecoration: 'none' }}
        >
          Оферта
        </Link>
        <span>·</span>
        <Link
          href="/info/privacy"
          style={{ pointerEvents: 'auto', color: 'inherit', textDecoration: 'none' }}
        >
          Конфиденциальность
        </Link>
        <span>·</span>
        <Link
          href="/info/support"
          style={{ pointerEvents: 'auto', color: 'inherit', textDecoration: 'none' }}
        >
          Поддержка
        </Link>
      </div>
    </>
  );
}
