import { format } from 'date-fns';

type MeResponse = {
  ok: boolean;
  user?: { telegramId: string; subscriptionUntil?: string | null } | null;
};

async function getMe(): Promise<MeResponse> {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? '';
  const res = await fetch(`${base}/api/me`, { cache: 'no-store' });
  return res.json();
}

export default async function CabinetPage() {
  const data = await getMe();
  const iso = data.user?.subscriptionUntil ?? null;
  const until = iso ? new Date(iso) : null;
  const active = until ? until.getTime() > Date.now() : false;
  const status = active
    ? `Подписка активна до ${format(until!, 'dd.MM.yyyy, HH:mm')}`
    : 'Не удалось получить статус';

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-6">Личный кабинет</h1>

      <section className="mb-6 rounded-xl border p-4">
        <h2 className="text-xl font-semibold mb-2">Статус подписки</h2>
        <p>{status}</p>
      </section>

      {/* Остальное содержимое кабинета остаётся как было */}
    </main>
  );
}
