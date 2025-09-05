// app/cabinet/page.tsx
type MeResponse = {
  ok: boolean;
  user?: { telegramId: string; subscriptionUntil?: string | null } | null;
};

function formatDate(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const fmt = new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  return fmt.format(d);
}

async function getMe(): Promise<MeResponse> {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? '';
  const res = await fetch(`${base}/api/me`, { cache: 'no-store' });
  return res.json();
}

export default async function CabinetPage() {
  const data = await getMe();
  const untilISO = data.user?.subscriptionUntil ?? null;
  const untilTs = untilISO ? new Date(untilISO).getTime() : 0;
  const active = untilTs > Date.now();

  let statusText: string;
  if (active) {
    statusText = `Подписка активна до ${formatDate(untilISO)}`;
  } else {
    statusText = 'Подписка неактивна';
  }

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-6">Личный кабинет</h1>

      <section className="mb-6 rounded-xl border p-4">
        <h2 className="text-xl font-semibold mb-2">Статус подписки</h2>
        <p>{statusText}</p>
      </section>
    </main>
  );
}
