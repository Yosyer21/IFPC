import { execSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';

/**
 * Prepara una base de datos PGlite (PostgreSQL embebido en WASM):
 * 1) Genera el SQL del esquema Prisma, 2) lo aplica, 3) carga los datos demo.
 * Uso: pnpm db:setup-pglite
 */
async function main() {
  const root = path.resolve(import.meta.dirname, '..', '..');
  const schemaPath = path.join(root, 'packages', 'database', 'prisma', 'schema.prisma');
  const dataDir =
    process.env.PGLITE_DIR ?? path.resolve(root, '.pglite');
  await mkdir(dataDir, { recursive: true });

  console.log('[pglite] generando SQL del esquema...');
  const sql = execSync(
    `npx prisma migrate diff --from-empty --to-schema-datamodel "${schemaPath}" --script`,
    {
      encoding: 'utf-8',
      cwd: root,
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/future_buller',
      },
    }
  );

  console.log('[pglite] aplicando esquema...');
  const pglite = new PGlite(dataDir);
  try {
    const check = await pglite.query(`SELECT to_regclass('public."User"') AS t`);
    const hasSchema = check.rows[0]?.t != null;
    if (hasSchema) {
      console.log('[pglite] esquema ya aplicado, se omite la creación');
    } else {
      await pglite.exec(sql);
      console.log('[pglite] esquema aplicado');
    }
  } finally {
    await pglite.close();
  }

  console.log('[pglite] cargando datos demo...');
  execSync('node --env-file=.env --import=tsx packages/database/prisma/seed.ts', {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, USE_PGLITE: 'true' },
  });

  console.log(`[pglite] base de datos lista en: ${dataDir}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
