// app/lib/subscription.ts
const LS_KEY = 'pro:until'; // timestamp ms ISO/number

function nowTs() { return Date.now(); }

function readLocal(): number | null {
  try {
    const v = localStorage.getItem(LS_KEY);
    if (!v) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : (new Date(v).getTime() || null);
  } catch { return null; }
}

function writeLocal(ts: number) {
  try { localStorage.setItem(LS_KEY, String(ts)); } catch {}
}

export function isPro(): boolean {
  const ts = readLocal();
  if (ts && ts > nowTs()) return true;
  try {
    fetch('/api/me', { cache: 'no-store' })
      .then(r => r.json()).then(j => {
        const until = j?.user?.subscriptionUntil ? new Date(j.user.subscriptionUntil).getTime() : 0;
        if (until && until > nowTs()) writeLocal(until);
      }).catch(()=>{});
  } catch {}
  return false;
}

export function applyProExtend(days: number) {
  const base = Math.max(readLocal() || 0, nowTs());
  const next = base + days * 24 * 60 * 60 * 1000;
  writeLocal(next);
}

export function setProUntil(ts: number) { writeLocal(ts); }

export function getProUntil(): Date | null {
  const ts = readLocal();
  return ts ? new Date(ts) : null;
}
