import { prisma } from './prisma';

export async function getUserSubscription(telegramId: string) {
  const user = await prisma.user.findUnique({ where: { telegramId } });
  return user?.subscriptionUntil || null;
}

export async function setUserSubscription(telegramId: string, until: Date) {
  return prisma.user.update({
    where: { telegramId },
    data: { subscriptionUntil: until }
  });
}

export function isPro(until?: Date | null): boolean {
  if (!until) return false;
  return new Date(until) > new Date();
}