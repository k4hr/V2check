// lib/favorites.ts
// Клиентские хелперы для избранного через /api/favorites.
// Добавлены алиасы: isFav, toggleFav (для совместимости со старым кодом).

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
  if (!res.ok || !(data as any)?.ok) {
    const err =
      (data as any)?.error ||
      (data as any)?.detail?.description ||
      'Ошибка запроса';
    throw new Error(String(err));
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

/* ==================== Алиасы для совместимости ==================== */

/**
 * Проверка, есть ли документ в избранном.
 * @param key — id документа ИЛИ url (старый код мог передавать по-разному)
 * @returns boolean
 */
export async function isFav(key: string): Promise<boolean> {
  if (!key) return false;
  const { items } = await listFavorites();
  return items.some((x) => x.id === key || x.url === key);
}

/**
 * Переключатель избранного.
 * Если передан только id — пробуем удалить по id.
 * Если переданы title (+ url/ note) — пробуем добавить.
 * Возвращает итоговое состояние.
 */
export async function toggleFav(input: any): Promise<{ ok: true; state: 'added' | 'removed' }> {
  try {
    // Вариант удаления (если явно пришёл id и он уже есть)
    if (typeof input === 'string') {
      const id = input;
      const was = await isFav(id);
      if (was) {
        await removeFavorite(id);
        return { ok: true, state: 'removed' };
      }
      // Если не найден по id — ничего не делаем (считаем удалённым)
      return { ok: true, state: 'removed' };
    }

    // Вариант добавления
    if (input && typeof input === 'object') {
      const { title, url, note, id } = input as {
        title?: string; url?: string; note?: string; id?: string;
      };

      // Если пришёл id и он в избранном — удалим
      if (id) {
        const was = await isFav(id);
        if (was) {
          await removeFavorite(id);
          return { ok: true, state: 'removed' };
        }
      }

      if (!title) throw new Error('title is required to add favorite');
      await addFavorite({ title, url, note });
      return { ok: true, state: 'added' };
    }

    throw new Error('invalid toggleFav input');
  } catch (e) {
    // Отдаём added/removed только если операция дошла до конца, иначе пробрасываем ошибку наверх
    throw e;
  }
}
