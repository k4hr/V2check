// app/cabinet/page.tsx
// Server wrapper to avoid SSR touching window. Renders client component only.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import CabinetClient from './CabinetClient';

export default function Page() {
  return <CabinetClient />;
}
