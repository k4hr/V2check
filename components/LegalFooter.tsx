/* path: components/LegalFooter.tsx */
'use client';

import Link from 'next/link';

type LegalFooterProps = {
  force?: boolean;
};

export default function LegalFooter(_: LegalFooterProps = {}) {
  return (
    <footer
      style={{
        marginTop: 24,
        paddingTop: 12,
        borderTop: '1px solid rgba(148,163,184,0.35)',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 11,
          lineHeight: 1.5,
          color: 'rgba(148,163,184,0.95)',
        }}
      >
        Оформляя подписку, вы принимаете условия{' '}
        <Link
          href="/info/offer"
          style={{ color: 'inherit', textDecoration: 'underline' }}
        >
          публичной оферты
        </Link>
        .
      </p>
    </footer>
  );
}
