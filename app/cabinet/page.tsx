// app/cabinet/page.tsx
import Link from 'next/link';
import { headers, cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

function formatRu(dt: Date) {
  return dt.toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function nameFromRaw(raw: any): string | null {
  try {
    const u = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!u || typeof u !== 'object') return null;
    if (u.first_name || u.last_name) return [u.first_name, u.last_name].filter(Boolean).join(' ');
    if (u.username) return String(u.username);
    if (u.id) return `id${u.id}`;
    return null;
  } catch {
    return null;
  }
}

export default async function CabinetPage() {
  const [h, c] = await Promise.all([headers(), cookies()]);

  // Абсолютный URL для server fetch
  const proto = h.get('x-forwarded-proto') ?? 'https';
  const host =
    h.get('x-forwarded-host') ??
    h.get('host') ??
    process.env.VERCEL_URL ??
    process.env.RAILWAY_PUBLIC_DOMAIN ??
    'localhost:3000';
  const base = `${proto}://${host}`;

  const fwd: HeadersInit = {};
  const hdrUser = h.get('x-telegram-user');
  if (hdrUser) fwd['x-telegram-user'] = hdrUser;
  const initData = c.get('tg_init_data')?.value;
  if (initData) fwd['x-telegram-init-data'] = initData;

  // Получаем статус из API
  let statusText = 'Не удалось получить статус';
  try {
    const res = await fetch(`${base}/api/me`, { headers: fwd, cache: 'no-store' });
    if (res.ok) {
      const j = await res.json();
      const until = j?.user?.subscriptionUntil ? new Date(j.user.subscriptionUntil) : null;
      if (until && until.getTime() > Date.now()) {
        statusText = `Подписка активна до ${formatRu(until)}`;
      } else {
        statusText = 'Подписка неактивна';
      }
    }
  } catch {}

  // Имя для приветствия
  let helloName: string | null = null;
  if (hdrUser) helloName = nameFromRaw(hdrUser);
  if (!helloName) {
    const cu = c.get('tg_user')?.value;
    if (cu) helloName = nameFromRaw(cu);
  }

  // === ВЕРСТКА: оставлена максимально нейтральной, чтобы не ломать твой дизайн ===
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-4xl font-extrabold tracking-tight md:text-5xl">Личный кабинет</h1>

      {helloName && (
        <p className="mb-6 text-lg text-zinc-300">
          Здравствуйте, <span className="font-semibold">{helloName}</span>
        </p>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow">
        <h2 className="mb-3 text-2xl font-semibold">Статус подписки</h2>
        <p className="text-zinc-200">{statusText}</p>

        <div className="mt-6 space-y-3">
          <Link
            href="/payments"
            className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-4 transition hover:bg-white/10"
          >
            <span className="flex items-center gap-3">
              <span className="text-xl">⭐</span>
              <span className="text-lg font-medium">Оформить/продлить подписку</span>
            </span>
            <span className="text-zinc-400">›</span>
          </Link>

          <Link
            href="/favorites"
            className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-4 transition hover:bg-white/10"
          >
            <span className="flex items-center gap-3">
              <span className="text-xl">🔅</span>
              <span className="text-lg font-medium">Избранное</span>
            </span>
            <span className="text-zinc-400">›</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
