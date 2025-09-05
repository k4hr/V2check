// lib/auth/index.ts
// Универсальный helper: извлекает telegramId из Request (подходит и для Edge, и для Node)
export async function getTelegramId(req: Request): Promise<string> {
  // 1) Спец-заголовок (если прокидывается прокси/ботом)
  const direct = req.headers.get('x-telegram-id');
  if (direct && String(direct).trim()) return String(direct).trim();

  // 2) Telegram WebApp initData — целиком в заголовке x-init-data
  const initData = req.headers.get('x-init-data') || '';
  if (initData) {
    try {
      const p = new URLSearchParams(initData);
      const userStr = p.get('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const id = user?.id ? String(user.id) : null;
      if (id) return id;
    } catch {}
  }

  // 3) query ?userId=
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('userId');
    if (q && String(q).trim()) return String(q).trim();
  } catch {}

  throw new Error('TELEGRAM_ID_NOT_FOUND');
}
