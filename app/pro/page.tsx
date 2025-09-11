// app/pro/page.tsx
export const dynamic = 'force-dynamic';

import ProClient from './ProClient';

export default function ProPageWrapper() {
  return <ProClient />;
}
