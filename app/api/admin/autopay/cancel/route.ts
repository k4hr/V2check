// path: app/api/admin/autopay/cancel/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  verifyInitData,
  getTelegramId,
  getInitDataFrom,
} from '@/lib/auth/verifyInitData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';
const ADMIN_TG_IDS = String(process.env.ADMIN_TG_IDS || '')
  .split(/[,\s]+/)
  .map((s) => s.trim())
  .filter(Boolean);

const ALLOW_BROWSER_DEBUG =
  (process.env.ALLOW_BROWSER_DEBUG || '').trim() === '1';

function getCookieFromHeader(headers: Headers, name: string): string {
  try {
    const raw = headers.get('cookie') || '';
    const parts = raw.split(/;\s*/);
    for (const p of parts) {
      const [k, ...v] = p.split('=');
      if (decodeURIComponent(k) === name)
        return decodeURIComponent(v.join('='));
    }
  } catch {}
  return '';
}

async function ensureAdmin(req: NextRequest) {
  const url = new URL(req.url);
  let initData = getInitDataFrom(req as any) || '';
  if (!initData)
    initData = getCookieFromHeader(req.headers, 'tg_init_data') || '';
  if (!initData) initData = url.searchParams.get('initData') || '';

  if (initData) {
    const ok = verifyInitData(initData, BOT_TOKEN);
    if (ok) {
      const id = getTelegramId(initData);
      if (id && ADMIN_TG_IDS.includes(String(id)))
        return { ok: true, id: String(id), via: 'initData' as const };
      return { ok: false as const, id: id || null, via: 'initData' as const };
    }
  }

  if (ALLOW_BROWSER_DEBUG) {
    const debugId = url.searchParams.get('id');
    if (
      debugId &&
      /^\d{3,15}$/.test(debugId) &&
      ADMIN_TG_IDS.includes(debugId)
    ) {
      return { ok: true as const, id: debugId, via: 'debugId' as const };
    }
  }

  return { ok: false as const, id: null, via: 'none' as const };
}

export async function POST(req: NextRequest) {
  try {
    const adm = await ensureAdmin(req);
    if (!adm.ok)
      return NextResponse.json(
        { ok: false, error: 'FORBIDDEN' },
        { status: 403 },
      );

    const { key } = await req.json().catch(() => ({} as any));
    const rawKey = String(key || '').trim();
    if (!rawKey) {
      return NextResponse.json(
        { ok: false, error: 'KEY_REQUIRED' },
        { status: 400 },
      );
    }

    // --- Определяем, по какому полю искать: TG ID или vk:123 ---
    let where: any = null;

    if (rawKey.startsWith('vk:')) {
      const vkId = rawKey.slice(3).trim();
      if (!vkId) {
        return NextResponse.json(
          { ok: false, error: 'BAD_VK_KEY' },
          { status: 400 },
        );
      }
      where = { vkUserId: vkId };
    } else {
      const tgIdNum = Number(rawKey);
      if (!Number.isFinite(tgIdNum)) {
        return NextResponse.json(
          { ok: false, error: 'BAD_TG_ID' },
          { status: 400 },
        );
      }
      where = { telegramId: tgIdNum };
    }

    const user = await prisma.user.findFirst({ where });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'USER_NOT_FOUND' },
        { status: 404 },
      );
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        autopayActive: false,
        autopayNextAt: null,
        autopayPlan: null,
        autopayTier: null,
        // Жёстко отвязываем платёжные реквизиты ЮKassa:
        ykPaymentMethodId: null,
        ykCustomerId: null,
        // trialActive трогать не обязательно; он про пробник, а не про рекуррент
      },
      select: {
        id: true,
        telegramId: true,
        vkUserId: true,
        autopayActive: true,
        autopayNextAt: true,
        autopayPlan: true,
        autopayTier: true,
        ykPaymentMethodId: true,
        ykCustomerId: true,
      },
    });

    return NextResponse.json({ ok: true, user: updated });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 },
    );
  }
}
