import { prisma } from './prisma';

export async function getFavorites(userId: string) {
  return prisma.favorite.findMany({ where: { userId } });
}

export async function addFavorite(userId: string, title: string, url?: string) {
  return prisma.favorite.create({
    data: { userId, title, url }
  });
}

export async function removeFavorite(id: string) {
  return prisma.favorite.delete({ where: { id } });
}