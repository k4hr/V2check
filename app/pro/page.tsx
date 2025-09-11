// app/pro/page.tsx — серверный wrapper для маршрута /pro
export const dynamic = 'force-dynamic';

import ProClient from './ProClient';

export default function ProPageWrapper() {
  return <ProClient />;
}
