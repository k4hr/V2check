export type VerifyResult =
  | { ok: true; data: { telegramId: string; payload?: any } }
  | { ok: false };

export async function verifyInitData(initData: string, botToken: string = process.env.BOT_TOKEN ?? ''): Promise<VerifyResult> {
  try {
    if (!initData) return { ok: false };
    const params = new URLSearchParams(initData);
    const userRaw = params.get('user');
    const user = userRaw ? JSON.parse(userRaw) : null;
    const id = user?.id ? String(user.id) : null;
    if (!id) return { ok: false };
    return { ok: true, data: { telegramId: id, payload: user } };
  } catch {
    return { ok: false };
  }
}

export async function getTelegramId(req: Request): Promise<string> {
  const fromHeader = req.headers.get('x-init-data') ?? '';
  const fromQuery = new URL(req.url).searchParams.get('initData') ?? '';
  const initData = fromHeader || fromQuery;
  if (!initData) throw new Error('UNAUTHORIZED');
  const v = await verifyInitData(initData);
  if (!v.ok) throw new Error('UNAUTHORIZED');
  return v.data.telegramId;
}
