// lib/favorites.ts
// Клиентские хелперы для избранного. Работают через /api/favorites.

export type FavoriteItem = {
  id: string;
  title: string;
  url?: string | null;
  note?: string | null;
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    cache: 'no-store',
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) {
    const err = (data?.error || data?.detail?.description || 'Ошибка запроса') as string;
    throw new Error(err);
  }
  return data as T;
}

/** Получить список избранного пользователя */
export async function listFavorites(): Promise<{ ok: true; items: FavoriteItem[] }> {
  return api<{ ok: true; items: FavoriteItem[] }>('/api/favorites', { method: 'GET' });
}

/** Добавить в избранное */
export async function addFavorite(input: { title: string; url?: string; note?: string }) {
  return api<{ ok: true; id: string }>('/api/favorites', {
    method: 'POST',
    body: JSON.stringify(input || {}),
  });
}

/** Удалить из избранного по id */
export async function removeFavorite(id: string) {
  if (!id) throw new Error('id is required');
  const url = `/api/favorites?id=${encodeURIComponent(id)}`;
  return api<{ ok: true }>(url, { method: 'DELETE' });
}
