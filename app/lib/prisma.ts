// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// Reuse Prisma client between hot reloads in dev
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Support both import styles:
//   import prisma from '@/lib/prisma'
//   import { prisma } from '@/lib/prisma'
export default prisma;
