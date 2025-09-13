// app/lib/favorites.ts
const KEY = 'fav:v1';

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter(x => typeof x === 'string') : [];
  } catch { return []; }
}

function write(arr: string[]) {
  try { localStorage.setItem(KEY, JSON.stringify(Array.from(new Set(arr)))); } catch {}
}

export function isFav(id: string): boolean {
  return read().includes(id);
}

export function toggleFav(id: string): boolean {
  const list = read();
  const i = list.indexOf(id);
  if (i >= 0) { list.splice(i, 1); write(list); return false; }
  list.push(id); write(list); return true;
}

export function listFav(): string[] { return read(); }
