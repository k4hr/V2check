// app/cabinet/page.tsx
// Server Component: no access to window here.
// Force dynamic rendering to avoid Next.js static prerender at build time.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import CabinetClient from './CabinetClient';

export default function CabinetPage() {
  return <CabinetClient />;
}
