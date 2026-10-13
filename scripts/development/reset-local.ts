import { execSync } from 'node:child_process';
import { mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';

/**
 * Reinicia el sistema en local: borra la base de datos embebida (PGlite), los
 * uploads, las cachés de build y vuelve a crear el esquema + datos demo.
 *
 * Uso:
 *   pnpm reset                    reinicio completo
 *   pnpm reset --keep-uploads     conserva los ficheros subidos
 *   pnpm reset --skip-seed        recrea la BD pero no vuelve a sembrar demo
 *
 * Nota: para `pnpm dev` antes de ejecutarlo (PGlite no admite dos procesos).
 */
const root = path.resolve(import.meta.dirname, '..', '..');
const flags = new Set(process.argv.slice(2));
const keepUploads = flags.has('--keep-uploads');
const skipSeed = flags.has('--skip-seed');

const pgliteDir = process.env.PGLITE_DIR
  ? path.resolve(process.env.PGLITE_DIR)
  : path.resolve(root, '.pglite');
const uploadsDir = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(root, 'apps', 'web', 'public', 'uploads');

function rel(target: string): string {
  const relative = path.relative(root, target);
  return relative.startsWith('..') ? target : relative || target;
}

async function removeDir(target: string, label: string): Promise<void> {
  try {
    await rm(target, { recursive: true, force: true });
    console.log(`  ✓ ${label}`);
  } catch (error) {
    console.warn(`  ! ${label}: no se pudo borrar (${(error as Error).message})`);
  }
}

async function emptyUploads(): Promise<void> {
  const subdirs = ['photos', 'posts', 'banners', 'documents'];
  for (const sub of subdirs) {
    const target = path.join(uploadsDir, sub);
    await mkdir(target, { recursive: true });
    let entries: string[] = [];
    try {
      entries = await readdir(target);
    } catch {
      entries = [];
    }
    for (const name of entries) {
      if (name === '.gitkeep') continue;
      await rm(path.join(target, name), { recursive: true, force: true });
    }
  }
  console.log(`  ✓ uploads vaciados (${rel(uploadsDir)})`);
}

async function removeCorruptBackups(): Promise<void> {
  let entries: string[] = [];
  try {
    entries = await readdir(root);
  } catch {
    return;
  }
  for (const name of entries.filter((entry) => entry.startsWith('.pglite.corrupt-'))) {
    await removeDir(path.join(root, name), `copia de BD corrupta (${name})`);
  }
}

async function main(): Promise<void> {
  console.log('Reiniciando el sistema en local (Future Baller)\n');

  console.log('Borrando base de datos, cachés y artefactos:');
  await removeDir(pgliteDir, `PGlite · ${rel(pgliteDir)}`);
  await removeDir(path.resolve(root, 'apps/web/.pglite'), 'PGlite de la app');
  await removeDir(path.resolve(root, 'apps/web/.next'), 'Next.js (.next)');
  await removeDir(path.resolve(root, '.turbo'), 'Turborepo raíz (.turbo)');
  await removeDir(path.resolve(root, 'apps/web/.turbo'), 'Turborepo web (.turbo)');
  await removeDir(path.resolve(root, 'apps/worker/dist'), 'Worker (dist)');
  await removeDir(path.resolve(root, 'apps/worker/.turbo'), 'Turborepo worker (.turbo)');
  await removeDir(path.resolve(root, 'test-results'), 'Playwright (test-results)');
  await removeDir(path.resolve(root, 'apps/web/tsconfig.tsbuildinfo'), 'tsbuildinfo');
  await removeCorruptBackups();

  if (keepUploads) {
    console.log('  · uploads conservados (--keep-uploads)');
  } else {
    await emptyUploads();
  }

  if (skipSeed) {
    console.log('\n--skip-seed: se omite la recreación del esquema y los datos demo.');
  } else {
    console.log('\nRecreando base de datos y datos demo (prisma + esquema + seed)…');
    execSync('pnpm db:setup-pglite', {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env, PGLITE_DIR: pgliteDir },
    });
  }

  console.log('\nSistema reiniciado. Arranca la app con:  pnpm dev');
  console.log('Logins demo: player@demo.com / player123 · admin@ifpc.com / admin123');
  console.log('Listado completo de perfiles:  pnpm scripts:create-test-users  (TEST_PROFILES.txt)');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
