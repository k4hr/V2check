// lib/limits.ts
import type { PrismaClient, User } from '@prisma/client';

export type Tier = 'FREE' | 'PRO' | 'PROPLUS';

export function todayUTC(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function getUserTier(u: Pick<User, 'subscriptionUntil' | 'plan'> | null): Tier {
  if (!u) return 'FREE';
  const active = !!(u.subscriptionUntil && u.subscriptionUntil > new Date());
  if (!active) return 'FREE';
  return (u.plan === 'PROPLUS') ? 'PROPLUS' : 'PRO';
}

// чтение лимитов из ENV
function num(envName: string, def: number): number {
  const raw = (process.env[envName] || '').trim();
  const n = Number(raw);
  return Number.isFinite(n) ? n : def;
}
function flag(envName: string, def: boolean): boolean {
  const raw = (process.env[envName] || '').trim();
  if (!raw) return def;
  return raw === '1' || /^true$/i.test(raw);
}

export function getDailyLimitByTier(tier: Tier): number {
  if (tier === 'PRO')     return num('PRO_QA_PER_DAY', 0);      // 0 => безлимит
  if (tier === 'PROPLUS') return num('PROPLUS_QA_PER_DAY', 0);  // 0 => безлимит
  return num('FREE_QA_PER_DAY', 2);
}

export function enforceByTier(tier: Tier): boolean {
  if (tier === 'PRO')     return flag('LIMITS_ENFORCE_PRO', false);
  if (tier === 'PROPLUS') return flag('LIMITS_ENFORCE_PROPLUS', false);
  return flag('LIMITS_ENFORCE_FREE', true);
}

/**
 * Проверка и инкремент дневного usage по userId.
 * NB: упрощённая атомарность — возможна редкая гонка в пике (MVP).
 */
export async function checkAndCountDailyUsage(
  prisma: PrismaClient,
  userId: string,
  limit: number,
  enforce: boolean
): Promise<{ ok: boolean; used: number; limit: number; reached: boolean }> {
  const date = todayUTC();

  // читаем текущее
  const current = await prisma.usageDaily.findUnique({
    where: { userId_date: { userId, date } },
    select: { used: true },
  });
  const used = current?.used ?? 0;

  if (enforce && limit > 0 && used >= limit) {
    return { ok: false, used, limit, reached: true };
  }

  // инкремент
  await prisma.usageDaily.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, used: 1 },
    update: { used: { increment: 1 } },
  });

  return { ok: true, used: used + 1, limit, reached: false };
}
