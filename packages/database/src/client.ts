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

let client: PrismaClient | undefined;

/**
 * Cliente creado de forma **perezosa**: importar este módulo no abre ninguna
 * conexión. Es importante para `next build`, que evalúa las páginas en varios
 * workers a la vez: si todos abrieran PGlite al importar, el directorio de datos
 * embebido se corrompe (varios escritores sobre el mismo WASM).
 */
function getClient(): PrismaClient {
  if (client) return client;
  client = globalForPrisma.prisma ?? createClient();
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
  }
  return client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const instance = getClient() as unknown as Record<string | symbol, unknown>;
    const value = instance[property];
    return typeof value === 'function'
      ? (value as (...args: unknown[]) => unknown).bind(instance)
      : value;
  },
  has(_target, property) {
    return property in (getClient() as unknown as object);
  },
});

