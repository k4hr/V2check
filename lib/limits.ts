// lib/limits.ts — заглушка подсчёта usage и мягкого/жёсткого лимита
import { prisma } from '@/lib/prisma';

export type Tier = 'FREE' | 'PRO' | 'PROPLUS';

// квоты (0 = безлимит)
const FREE_QA_PER_DAY    = Number(process.env.FREE_QA_PER_DAY    || 2);
const PRO_QA_PER_DAY     = Number(process.env.PRO_QA_PER_DAY     || 0);
const PROPLUS_QA_PER_DAY = Number(process.env.PROPLUS_QA_PER_DAY || 0);

// включение «жёсткого» ограничения по тарифам
const ENF_FREE    = (process.env.LIMITS_ENFORCE_FREE    || '1').trim() === '1';
const ENF_PRO     = (process.env.LIMITS_ENFORCE_PRO     || '0').trim() === '1';
const ENF_PROPLUS = (process.env.LIMITS_ENFORCE_PROPLUS || '0').trim() === '1';

// ===== базовые утилиты =====
export function todayStrUTC(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

// alias под ожидаемое имя
export const todayUTC = todayStrUTC;

// определить тариф пользователя
export function resolveTier(u?: { plan?: string | null; subscriptionUntil?: Date | null }): Tier {
  if (!u) return 'FREE';
  const active = !!(u.subscriptionUntil && u.subscriptionUntil > new Date());
  if (!active) return 'FREE';
  const plan = String(u.plan || '').toUpperCase();
  return plan === 'PROPLUS' ? 'PROPLUS' : 'PRO';
}

// alias под ожидаемое имя
export const getUserTier = resolveTier;

// квота по тарифу
export function dailyLimitByTier(tier: Tier): number {
  if (tier === 'PROPLUS') return PROPLUS_QA_PER_DAY;
  if (tier === 'PRO')     return PRO_QA_PER_DAY;
  return FREE_QA_PER_DAY;
}

// alias под ожидаемое имя
export const getDailyLimitByTier = dailyLimitByTier;

// нужно ли «жёстко» ограничивать для тарифа
export function enforceByTier(tier: Tier): boolean {
  if (tier === 'PROPLUS') return ENF_PROPLUS;
  if (tier === 'PRO')     return ENF_PRO;
  return ENF_FREE;
}

// текущее использованное за сегодня
export async function getUsedToday(userId: string): Promise<number> {
  const date = todayStrUTC();
  const row = await prisma.usageDaily.findUnique({
    where: { userId_date: { userId, date } },
    select: { used: true },
  });
  return row?.used ?? 0;
}

// +1 к счётчику
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

// ===== универсальная точка — по telegramId =====
export async function trackAndGateByTelegramId(telegramId: string): Promise<{
  ok: boolean;
  reason?: 'LIMIT_REACHED';
  tier: Tier;
  used: number;
  limit: number;
  remaining: number | null;
  userId: string;
}> {
  // гарантируем пользователя
  const user = await prisma.user.upsert({
    where: { telegramId },
    create: { telegramId },
    update: {},
    select: { id: true, plan: true, subscriptionUntil: true },
  });

  const tier     = resolveTier(user);
  const limit    = dailyLimitByTier(tier);
  const enforce  = enforceByTier(tier);

  if (!enforce || limit === 0) {
    const used = await incUsedToday(user.id);
    return {
      ok: true,
      tier,
      used,
      limit,
      remaining: limit === 0 ? null : Math.max(limit - used, 0),
      userId: user.id,
    };
  }

  const usedBefore = await getUsedToday(user.id);
  if (usedBefore >= limit) {
    return {
      ok: false,
      reason: 'LIMIT_REACHED',
      tier,
      used: usedBefore,
      limit,
      remaining: 0,
      userId: user.id,
    };
  }
  const used = await incUsedToday(user.id);
  return {
    ok: true,
    tier,
    used,
    limit,
    remaining: Math.max(limit - used, 0),
    userId: user.id,
  };
}

/**
 * Совместимость с импортами в твоём route.ts:
 * checkAndCountDailyUsage(id, { by: 'telegramId' | 'userId' })
 * Возвращает { ok, reason?, tier, used, limit, remaining, userId }
 */
export async function checkAndCountDailyUsage(
  id: string,
  opts?: { by?: 'telegramId' | 'userId' } | any,
): Promise<{
  ok: boolean;
  reason?: 'LIMIT_REACHED';
  tier: Tier;
  used: number;
  limit: number;
  remaining: number | null;
  userId: string;
}> {
  const by = (opts?.by as 'telegramId' | 'userId') || 'telegramId';

  if (by === 'userId') {
    // уже знаем userId
    const u = await prisma.user.findUnique({
      where: { id },
      select: { id: true, plan: true, subscriptionUntil: true, telegramId: true },
    });
    if (!u) {
      // на всякий случай создадим запись c пустым телеграмId
      const nu = await prisma.user.create({ data: { telegramId: id } });
      const tier = 'FREE' as Tier;
      const limit = dailyLimitByTier(tier);
      const used = await incUsedToday(nu.id);
      return { ok: true, tier, used, limit, remaining: limit === 0 ? null : Math.max(limit - used, 0), userId: nu.id };
    }

    const tier    = resolveTier(u);
    const limit   = dailyLimitByTier(tier);
    const enforce = enforceByTier(tier);

    if (!enforce || limit === 0) {
      const used = await incUsedToday(u.id);
      return { ok: true, tier, used, limit, remaining: limit === 0 ? null : Math.max(limit - used, 0), userId: u.id };
    }

    const usedBefore = await getUsedToday(u.id);
    if (usedBefore >= limit) {
      return { ok: false, reason: 'LIMIT_REACHED', tier, used: usedBefore, limit, remaining: 0, userId: u.id };
    }
    const used = await incUsedToday(u.id);
    return { ok: true, tier, used, limit, remaining: Math.max(limit - used, 0), userId: u.id };
  }

  // by === 'telegramId' (дефолт)
  return trackAndGateByTelegramId(id);
}
