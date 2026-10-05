import { execSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';

/**
 * Aplica a la base de datos PGlite local el delta SQL entre el esquema actual
 * (árbol de trabajo) y otra versión del mismo (por defecto, la última
 * commiteada). No destructivo: solo añade/ajusta lo que cambió.
 *
 * Uso:  pnpm scripts:apply-delta [ref]        (ref por defecto: HEAD)
 *
 * Para una base de datos con Postgres real usa `pnpm db:migrate`.
 */
async function main() {
  const root = path.resolve(import.meta.dirname, '..', '..');
  const schemaPath = path.join(root, 'packages', 'database', 'prisma', 'schema.prisma');
  const dataDir = process.env.PGLITE_DIR ?? path.resolve(root, '.pglite');
  const ref = process.argv[2] ?? 'HEAD';

  // 1) Esquema base (versión anterior) en un fichero temporal.
  const dir = await mkdtemp(path.join(tmpdir(), 'ifpc-delta-'));
  const baseSchema = path.join(dir, 'base.prisma');
  const previous = execSync(`git show ${ref}:packages/database/prisma/schema.prisma`, {
    cwd: root,
    encoding: 'utf-8',
  });
  await writeFile(baseSchema, previous, 'utf-8');

  // 2) Delta SQL entre ambos esquemas.
  console.log(`[delta] comparando ${ref} -> árbol de trabajo...`);
  const sql = execSync(
    `pnpm --filter @ifpc/database exec prisma migrate diff --from-schema-datamodel "${baseSchema}" --to-schema-datamodel "${schemaPath}" --script`,
    {
      cwd: root,
      encoding: 'utf-8',
      env: {
        ...process.env,
        DATABASE_URL:
          process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/ifpc',
      },
    }
  ).trim();
  await rm(dir, { recursive: true, force: true });

  if (!sql) {
    console.log('[delta] sin cambios de esquema');
    return;
  }
  console.log(sql);

  // 3) Aplicar el delta a la base de datos embebida.
  const pglite = new PGlite(dataDir);
  try {
    await pglite.exec(sql);
    console.log(`[delta] aplicado en ${dataDir}`);
  } finally {
    await pglite.close();
  }

  // 4) Regenerar el cliente Prisma con los nuevos modelos.
  execSync('pnpm --filter @ifpc/database db:generate', {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
