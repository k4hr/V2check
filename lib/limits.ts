// lib/limits.ts
import type { PrismaClient } from '@prisma/client';

export type Tier = 'FREE' | 'PRO' | 'PROPLUS';

export type UsageResult = {
  ok: boolean;
  used: number;      // текущее значение used после операции
  limit: number;     // суточный лимит для информации
  date: string;      // YYYY-MM-DD (UTC)
  reached?: boolean; // true, если лимит достигнут/превышен (ok === false)
};

/** Дата в UTC, формат YYYY-MM-DD */
export function todayUTC(d = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/** Тариф пользователя по данным БД: если подписка активна — план, иначе FREE */
export async function getUserTier(prisma: PrismaClient, telegramId: string | null | undefined): Promise<Tier> {
  if (!telegramId) return 'FREE';
  const u = await prisma.user.findFirst({
    where: { telegramId: String(telegramId) },
    select: { subscriptionUntil: true, plan: true },
  });
  const now = new Date();
  const active = !!(u?.subscriptionUntil && u.subscriptionUntil > now);
  if (!active) return 'FREE';
  return (u?.plan === 'PROPLUS' ? 'PROPLUS' : 'PRO');
}

/** Суточные лимиты по тарифам (по умолчанию считаем всем, режем только FREE) */
export function getDailyLimitByTier(tier: Tier): number {
  const envOr = (name: string, def: number) => {
    const v = Number(process.env[name] ?? '');
    return Number.isFinite(v) && v > 0 ? v : def;
  };
  if (tier === 'FREE')     return envOr('LIMIT_FREE_QA_PER_DAY',  Number(process.env.FREE_QA_PER_DAY ?? 2) || 2);
  if (tier === 'PRO')      return envOr('LIMIT_PRO_QA_PER_DAY',   999999); // считаем, но практически не ограничиваем
  /* tier === 'PROPLUS' */ return envOr('LIMIT_PROPLUS_QA_PER_DAY', 999999);
}

/** Для какого тарифа реально применяем ограничение (отрезаем запросы) */
export function enforceByTier(tier: Tier): boolean {
  return tier === 'FREE'; // PRO/PROPLUS — считаем usage, но не блокируем
}

/**
 * Прочитать/создать запись usage и при необходимости инкрементировать.
 * Если enforce=true и used >= limit — не инкрементируем и возвращаем ok=false.
 */
export async function checkAndCountDailyUsage(
  prisma: PrismaClient,
  userId: string,
  limit: number,
  enforce: boolean,
): Promise<UsageResult> {
  const date = todayUTC();

  const existing = await prisma.usageDaily.findFirst({
    where: { userId, date },
    select: { id: true, used: true },
  });

  const currentUsed = existing?.used ?? 0;

  // Если режем и лимит уже достигнут — возвращаем отказ
  if (enforce && currentUsed >= limit) {
    return { ok: false, reached: true, used: currentUsed, limit, date };
  }

  // Иначе, при enforce инкрементим на 1; при не-enforce просто читаем без инкремента
  if (enforce) {
    if (existing) {
      const updated = await prisma.usageDaily.update({
        where: { id: existing.id },
        data: { used: { increment: 1 } },
        select: { used: true },
      });
      return { ok: true, used: updated.used, limit, date };
    } else {
      const created = await prisma.usageDaily.create({
        data: { userId, date, used: 1 },
        select: { used: true },
      });
      return { ok: true, used: created.used, limit, date };
    }
  } else {
    // не режем — гарантируем, что запись есть (для статистики), но без инкремента
    if (!existing) {
      await prisma.usageDaily.create({ data: { userId, date, used: 0 } });
      return { ok: true, used: 0, limit, date };
    }
    return { ok: true, used: existing.used, limit, date };
  }
}
