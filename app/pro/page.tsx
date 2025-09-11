// app/pro/page.tsx
// ВАЖНО: это СЕРВЕРНЫЙ файл (без 'use client'), именно здесь работает dynamic.
export const dynamic = 'force-dynamic';

import ProClient from './ProClient';

export default function ProPageWrapper() {
  return <ProClient />;
}
