// app/api/me/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  verifyInitData,
  getInitDataFrom,
  getTelegramIdStrict,
} from '@/lib/auth/verifyInitData';
import {
  verifyVkMiniAppsLaunchParams,
  parseVkLaunchParams,
} from '@/lib/vk/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';
const VK_SECURE_KEY = process.env.VK_SECURE_KEY || '';
const ALLOW_BROWSER_DEBUG =
  (process.env.ALLOW_BROWSER_DEBUG || process.env.NEXT_PUBLIC_ALLOW_BROWSER_DEBUG || '').trim() === '1';

// ————— утилиты —————
function extractUnsafeUserFromTg(initData: string): {
  id?: number | string;
  username?: string;
  first_name?: string;
  last_name?: string;
} | null {
  try {
    const p = new URLSearchParams(initData);
    const raw = p.get('user');
    return raw ? (JSON.parse(raw) as any) : null;
  } catch {
    return null;
  }
}

type AuthResult =
  | { provider: 'telegram'; key: string; profile?: { username?: string; firstName?: string; lastName?: string }; via: string }
  | { provider: 'vk';       key: string; profile?: { username?: string; firstName?: string; lastName?: string }; via: string };

// ————— основная ручка —————
export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);

    // 1) Пытаемся распознать VK (приоритетно, если в заголовке есть vk-параметры)
    const rawVkParams =
      req.headers.get('x-vk-params') ||
      ''; // middleware прокидывает сюда vk_* и sign

    if (rawVkParams && VK_SECURE_KEY) {
      const isValid = verifyVkMiniAppsLaunchParams(rawVkParams, VK_SECURE_KEY);
      if (!isValid) {
        return NextResponse.json({ ok: false, error: 'BAD_VK_SIGN' }, { status: 401 });
      }
      const vk = parseVkLaunchParams(rawVkParams);
      const vkUserId = String(vk.vk_user_id || '');
      if (!vkUserId) {
        return NextResponse.json({ ok: false, error: 'VK_USER_ID_MISSING' }, { status: 401 });
      }

      const auth: AuthResult = {
        provider: 'vk',
        key: `vk:${vkUserId}`, // пишем в колонку telegramId (строка) без миграций
        profile: undefined,    // подробный профиль можно подтягивать через VK API при необходимости
        via: 'vk_params',
      };

      return await upsertAndReply(auth);
    }

    // 2) Telegram initData (как было)
    const initData = getInitDataFrom(req);
    if (initData) {
      if (!BOT_TOKEN || !verifyInitData(initData, BOT_TOKEN)) {
        return NextResponse.json({ ok: false, error: 'BAD_INITDATA' }, { status: 401 });
      }
      const telegramId = getTelegramIdStrict(initData);
      const uUnsafe = extractUnsafeUserFromTg(initData) || undefined;

      const auth: AuthResult = {
        provider: 'telegram',
        key: telegramId, // совместимость с существующими записями
        profile: uUnsafe
          ? {
              username: uUnsafe.username,
              firstName: uUnsafe.first_name,
              lastName: uUnsafe.last_name,
            }
          : undefined,
        via: 'initData',
      };

      return await upsertAndReply(auth);
    }

    // 3) Debug-путь из браузера (?id=...&platform=vk|tg) — только если явно разрешён
    if (ALLOW_BROWSER_DEBUG) {
      const id = url.searchParams.get('id') || '';
      const platform = (url.searchParams.get('platform') || '').toLowerCase();

      if (id) {
        const auth: AuthResult =
          platform === 'vk'
            ? { provider: 'vk', key: `vk:${id}`, via: 'debugId' }
            : { provider: 'telegram', key: id, via: 'debugId' };

        return await upsertAndReply(auth);
      }
    }

    // 4) Ничего не подошло — нет аутентификации
    return NextResponse.json(
      {
        ok: false,
        error: 'AUTH_REQUIRED',
        hint: ALLOW_BROWSER_DEBUG
          ? 'Pass ?id=<ID>&platform=vk|tg for debug mode'
          : 'Open from Telegram/VK Mini App so auth params are present',
      },
      { status: 401 },
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500 },
    );
  }
}

// Для удобства — GET зеркалит POST
export const GET = POST;

// ————— helper: upsert user и ответ —————
async function upsertAndReply(auth: AuthResult) {
  const now = new Date();

  // Пишем в одну и ту же колонку telegramId (string).
  // Для VK — значение вида "vk:<user_id>"
  const user = await prisma.user.upsert({
    where: { telegramId: auth.key },
    create: {
      telegramId: auth.key,
      username: auth.profile?.username || null,
      firstName: auth.profile?.firstName || null,
      lastName: auth.profile?.lastName || null,
      lastSeenAt: now,
    },
    update: {
      username: auth.profile?.username ?? undefined,
      firstName: auth.profile?.firstName ?? undefined,
      lastName: auth.profile?.lastName ?? undefined,
      lastSeenAt: now,
    },
    select: {
      telegramId: true,          // тут будет либо "123456", либо "vk:123456"
      subscriptionUntil: true,
      plan: true,
    },
  });

  const active = !!(user.subscriptionUntil && user.subscriptionUntil > now);

  return NextResponse.json({
    ok: true,
    user: { telegramId: user.telegramId }, // оставляем имя поля для обратной совместимости
    provider: auth.provider,               // кому нужно различать — берите это поле
    subscription: {
      active,
      expiresAt: user.subscriptionUntil || null,
      plan: user.plan || null,
    },
    via: auth.via,
  });
}
