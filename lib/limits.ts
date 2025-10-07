// lib/limits.ts — заглушка подсчёта и мягкого/жёсткого лимита
import { prisma } from '@/lib/prisma';

export type Tier = 'FREE' | 'PRO' | 'PROPLUS';

const FREE_QA_PER_DAY     = Number(process.env.FREE_QA_PER_DAY     || 2);
const PRO_QA_PER_DAY      = Number(process.env.PRO_QA_PER_DAY      || 0); // 0 = безлим
const PROPLUS_QA_PER_DAY  = Number(process.env.PROPLUS_QA_PER_DAY  || 0); // 0 = безлим

const ENF_FREE    = (process.env.LIMITS_ENFORCE_FREE    || '1').trim() === '1';
const ENF_PRO     = (process.env.LIMITS_ENFORCE_PRO     || '0').trim() === '1';
const ENF_PROPLUS = (process.env.LIMITS_ENFORCE_PROPLUS || '0').trim() === '1';

export function todayStrUTC(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function resolveTier(u?: { plan?: string | null; subscriptionUntil?: Date | null }): Tier {
  if (!u) return 'FREE';
  const active = !!(u.subscriptionUntil && u.subscriptionUntil > new Date());
  if (!active) return 'FREE';
  const plan = String(u.plan || '').toUpperCase();
  return plan === 'PROPLUS' ? 'PROPLUS' : 'PRO';
}

export function dailyLimitByTier(tier: Tier): number {
  if (tier === 'PROPLUS') return PROPLUS_QA_PER_DAY;
  if (tier === 'PRO')     return PRO_QA_PER_DAY;
  return FREE_QA_PER_DAY;
}

export function enforceByTier(tier: Tier): boolean {
  if (tier === 'PROPLUS') return ENF_PROPLUS;
  if (tier === 'PRO')     return ENF_PRO;
  return ENF_FREE;
}

/** Текущее значение used за сегодня (UTC) */
export async function getUsedToday(userId: string): Promise<number> {
  const date = todayStrUTC();
  const row = await prisma.usageDaily.findUnique({
    where: { userId_date: { userId, date } },
    select: { used: true },
  });
  return row?.used ?? 0;
}

/** +1 к счётчику на сегодня, вернуть новое значение */
export async function incUsedToday(userId: string): Promise<number> {
  const date = todayStrUTC();
  const row = await prisma.usageDaily.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, used: 1 },
    update: { used: { increment: 1 } },
    select: { used: true },
  });
  return row.used;
}

/**
 * Универсальная точка входа: на вход Telegram ID, на выход —
 * можно/нельзя, сколько уже использовано и лимит для тарифа.
 *
 * Политика «считаем всем, режем только кому включили ENFORCE».
 */
export async function trackAndGateByTelegramId(telegramId: string): Promise<{
  ok: boolean;               // можно ли пускать дальше
  reason?: 'LIMIT_REACHED';  // причина отказа, если ок=false
  tier: Tier;                // FREE | PRO | PROPLUS
  used: number;              // использовано за сегодня (после инкремента, если ок=true)
  limit: number;             // дневной лимит (0 = безлимит)
  remaining: number | null;  // остаток (для 0-лимита = null)
}> {
  // гарантируем пользователя (если вдруг нет записи — создадим пустую)
  const user = await prisma.user.upsert({
    where: { telegramId },
    create: { telegramId },
    update: {},
    select: { id: true, plan: true, subscriptionUntil: true },
  });

  const tier   = resolveTier(user);
  const limit  = dailyLimitByTier(tier);
  const enforce = enforceByTier(tier);

  // если не режем или лимит = 0 → просто считаем + пускаем
  if (!enforce || limit === 0) {
    const used = await incUsedToday(user.id);
    return {
      ok: true,
      tier,
      used,
      limit,
      remaining: limit === 0 ? null : Math.max(limit - used, 0),
    };
  }

  // жёсткое ограничение
  const usedBefore = await getUsedToday(user.id);
  if (usedBefore >= limit) {
    return {
      ok: false,
      reason: 'LIMIT_REACHED',
      tier,
      used: usedBefore,
      limit,
      remaining: 0,
    };
  }
  const used = await incUsedToday(user.id);
  return {
    ok: true,
    tier,
    used,
    limit,
    remaining: Math.max(limit - used, 0),
  };
}
