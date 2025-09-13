// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var _prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient = global._prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global._prisma = prisma;
}

export default prisma;
