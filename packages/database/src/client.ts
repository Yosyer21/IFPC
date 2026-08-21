import { Prisma, PrismaClient } from '@prisma/client';
import { PGlite } from '@electric-sql/pglite';
import { PrismaPGlite } from 'pglite-prisma-adapter';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const log: Prisma.LogLevel[] =
    process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'];
  if (process.env.USE_PGLITE === 'true') {
    // PostgreSQL embebido (WASM) — sin necesidad de servidor externo.
    const dataDir = process.env.PGLITE_DIR ?? './.pglite';
    const pglite = new PGlite(dataDir);
    const adapter = new PrismaPGlite(pglite);
    return new PrismaClient({ adapter, log });
  }
  return new PrismaClient({ log });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
