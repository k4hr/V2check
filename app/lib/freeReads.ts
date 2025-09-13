// app/lib/freeReads.ts
const KEY_DAY = 'free:day';
const KEY_CNT = 'free:count';
const FREE_PER_DAY = 2;

function today(): string {
  const d = new Date();
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function rs<T>(k: string, def: T): T {
  try {
    const v = localStorage.getItem(k);
    if (v == null) return def;
    return (typeof def === 'number') ? (Number(v) as any) : (v as any);
  } catch { return def; }
}

function ws(k: string, v: string) { try { localStorage.setItem(k, v); } catch {} }

export function remaining(isPro: boolean): number {
  if (isPro) return Infinity as any;
  const day = rs(KEY_DAY, '');
  const cnt = rs(KEY_CNT, 0);
  if (day !== today()) return FREE_PER_DAY;
  return Math.max(0, FREE_PER_DAY - cnt);
}

export function canOpen(_docId?: string, isPro?: boolean): boolean {
  if (isPro) return true;
  return remaining(false) > 0;
}

export function registerOpen(_docId?: string, isPro?: boolean) {
  if (isPro) return;
  const day = rs(KEY_DAY, '');
  const cnt = rs(KEY_CNT, 0);
  if (day !== today()) {
    ws(KEY_DAY, today());
    ws(KEY_CNT, '1');
  } else {
    ws(KEY_CNT, String(Math.min(FREE_PER_DAY, cnt + 1)));
  }
}
