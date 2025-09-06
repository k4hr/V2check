\
// app/cabinet/page.tsx
import React from 'react';

type MeResponse = {
  ok: boolean;
  user?: {
    subscriptionUntil: string | null;
    isActive: boolean;
  };
};

async function getMe(): Promise<MeResponse> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/me`, { cache: 'no-store' });
    if (!res.ok) return { ok: false };
    return await res.json();
  } catch {
    return { ok: false };
  }
}

export default async function CabinetPage() {
  const me = await getMe();

  let statusText = 'Не удалось получить статус';
  if (me.ok && me.user) {
    if (me.user.isActive && me.user.subscriptionUntil) {
      const d = new Date(me.user.subscriptionUntil);
      const pad = (n: number) => String(n).padStart(2, '0');
      statusText = `Подписка активна до ${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } else {
      statusText = 'Подписка неактивна';
    }
  }

  return (
    <div className="px-5 py-6">
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="text-center text-lg">{statusText}</div>
      </div>
    </div>
  );
}
