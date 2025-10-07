// lib/limits.ts — учёт usage + совместимость с существующими импортами
import { prisma } from '@/lib/prisma';

export type Tier = 'FREE' | 'PRO' | 'PROPLUS';

// квоты (0 = безлимит)
const FREE_QA_PER_DAY    = Number(process.env.FREE_QA_PER_DAY    || 2);
const PRO_QA_PER_DAY     = Number(process.env.PRO_QA_PER_DAY     || 0);
const PROPLUS_QA_PER_DAY = Number(process.env.PROPLUS_QA_PER_DAY || 0);

// кого реально ограничиваем (жёстко)
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

// alias под ожидаемое имя в импортах
export const todayUTC = todayStrUTC;

// тариф
export function resolveTier(u?: { plan?: string | null; subscriptionUntil?: Date | null }): Tier {
  if (!u) return 'FREE';
  const active = !!(u.subscriptionUntil && u.subscriptionUntil > new Date());
  if (!active) return 'FREE';
  const plan = String(u.plan || '').toUpperCase();
  return plan === 'PROPLUS' ? 'PROPLUS' : 'PRO';
}
export const getUserTier = resolveTier;

// лимит по тарифу
export function dailyLimitByTier(tier: Tier): number {
  if (tier === 'PROPLUS') return PROPLUS_QA_PER_DAY;
  if (tier === 'PRO')     return PRO_QA_PER_DAY;
  return FREE_QA_PER_DAY;
}
export const getDailyLimitByTier = dailyLimitByTier;

// строгая ли политика для тарифа
export function enforceByTier(tier: Tier): boolean {
  if (tier === 'PROPLUS') return ENF_PROPLUS;
  if (tier === 'PRO')     return ENF_PRO;
  return ENF_FREE;
}

// текущее использованное
export async function getUsedToday(userId: string): Promise<number> {
  const date = todayStrUTC();
  const row = await prisma.usageDaily.findUnique({
    where: { userId_date: { userId, date } },
    select: { used: true },
  });
  return row?.used ?? 0;
}

// инкремент
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
 * Совместим оба способа вызова:
 * 1) Новый:   checkAndCountDailyUsage(id, { by: 'telegramId'|'userId' })
 * 2) Легаси:  checkAndCountDailyUsage(prisma, userId, limit, enforce)
 *
 * Возвращает унифицированный ответ.
 */
type UsageResult = {
  ok: boolean;
  reason?: 'LIMIT_REACHED';
  tier: Tier;
  used: number;
  limit: number;
  remaining: number | null;
  userId: string;
};

export async function checkAndCountDailyUsage(a: any, b?: any, c?: any, d?: any): Promise<UsageResult> {
  // ---- ЛЕГАСИ ВАРИАНТ: (prisma, userId, limit, enforce)
  if (typeof a === 'object' && a !== null && typeof b === 'string') {
    const userId = String(b);
    const limit = Number(c ?? 0);
    const enforce = Boolean(d);

    const tier: Tier = 'FREE'; // легаси не знает тариф — не критично
    if (!enforce || limit === 0) {
      const used = await incUsedToday(userId);
      return { ok: true, tier, used, limit, remaining: limit === 0 ? null : Math.max(limit - used, 0), userId };
    }
    const usedBefore = await getUsedToday(userId);
    if (usedBefore >= limit) {
      return { ok: false, reason: 'LIMIT_REACHED', tier, used: usedBefore, limit, remaining: 0, userId };
    }
    const used = await incUsedToday(userId);
    return { ok: true, tier, used, limit, remaining: Math.max(limit - used, 0), userId };
  }

  // ---- НОВЫЙ ВАРИАНТ: (id, { by })
  const id = String(a || '');
  const by = (b?.by as 'telegramId' | 'userId') || 'telegramId';

  if (by === 'userId') {
    const u = await prisma.user.findUnique({
      where: { id },
      select: { id: true, plan: true, subscriptionUntil: true },
    });
    // если нет — создадим «пустого» пользователя с telegramId=id (мягкий путь)
    const ensured = u ?? (await prisma.user.create({ data: { telegramId: id } }));
    const tier = resolveTier(ensured);
    const limit = dailyLimitByTier(tier);
    const enforce = enforceByTier(tier);

    if (!enforce || limit === 0) {
      const used = await incUsedToday(ensured.id);
      return { ok: true, tier, used, limit, remaining: limit === 0 ? null : Math.max(limit - used, 0), userId: ensured.id };
    }
    const usedBefore = await getUsedToday(ensured.id);
    if (usedBefore >= limit) {
      return { ok: false, reason: 'LIMIT_REACHED', tier, used: usedBefore, limit, remaining: 0, userId: ensured.id };
    }
    const used = await incUsedToday(ensured.id);
    return { ok: true, tier, used, limit, remaining: Math.max(limit - used, 0), userId: ensured.id };
  }

  // by === 'telegramId'
  const ensured = await prisma.user.upsert({
    where: { telegramId: id },
    create: { telegramId: id },
    update: {},
    select: { id: true, plan: true, subscriptionUntil: true },
  });

  const tier = resolveTier(ensured);
  const limit = dailyLimitByTier(tier);
  const enforce = enforceByTier(tier);

  if (!enforce || limit === 0) {
    const used = await incUsedToday(ensured.id);
    return { ok: true, tier, used, limit, remaining: limit === 0 ? null : Math.max(limit - used, 0), userId: ensured.id };
  }
  const usedBefore = await getUsedToday(ensured.id);
  if (usedBefore >= limit) {
    return { ok: false, reason: 'LIMIT_REACHED', tier, used: usedBefore, limit, remaining: 0, userId: ensured.id };
  }
  const used = await incUsedToday(ensured.id);
  return { ok: true, tier, used, limit, remaining: Math.max(limit - used, 0), userId: ensured.id };
}
