// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __PRISMA__: PrismaClient | undefined;
}

const prisma = global.__PRISMA__ ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__PRISMA__ = prisma;
}

export default prisma;
