/**
 * Migra los documentos antiguos de `public/uploads/documents` al almacén privado
 * y actualiza `storageKey`, `mimeType` y `url` a la ruta autenticada.
 *
 * Uso:
 *   pnpm scripts:migrate-documents                 informe, no toca nada
 *   pnpm scripts:migrate-documents -- --apply      mueve y actualiza
 *
 * Con PGlite hay que parar `pnpm dev` antes de lanzarlo.
 */
import { readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '@ifpc/database';
import { DOCUMENT_MIME_EXT } from '../../apps/web/lib/documents';
import { writePrivateObject } from '../../apps/web/lib/storage/private';

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const PUBLIC_DOCS = path.join(process.cwd(), 'public', 'uploads', 'documents');

const EXT_MIME: Record<string, string> = Object.fromEntries(
  Object.entries(DOCUMENT_MIME_EXT).map(([mime, ext]) => [ext, mime])
);

async function main() {
  const documents = await prisma.document.findMany({
    where: { storageKey: null },
    select: { id: true, playerId: true, title: true, url: true },
  });

  console.log(
    `Documentos antiguos: ${documents.length}${apply ? '' : ' (informe, sin cambios)'}\n`
  );

  let migrated = 0;
  for (const document of documents) {
    const prefix = '/uploads/documents/';
    if (!document.url.startsWith(prefix)) {
      console.log(`· ${document.id}: URL no local, se omite (${document.url})`);
      continue;
    }
    const filename = document.url.slice(prefix.length);
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      console.log(`· ${document.id}: URL no válida (${document.url}), se omite`);
      continue;
    }
    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
    const mimeType = EXT_MIME[ext];
    if (!mimeType) {
      console.log(`· ${document.id}: extensión no soportada (${ext}), se omite`);
      continue;
    }

    const storageKey = `documents/${document.playerId}/${document.id}.${ext}`;
    if (!apply) {
      console.log(`· ${document.title}: ${filename} → ${storageKey}`);
      continue;
    }

    try {
      const buffer = await readFile(path.join(PUBLIC_DOCS, filename));
      await writePrivateObject(storageKey, buffer);
      await prisma.document.update({
        where: { id: document.id },
        data: { storageKey, mimeType, url: `/api/documents/${document.id}/file` },
      });
      await rm(path.join(PUBLIC_DOCS, filename), { force: true });
      migrated += 1;
      console.log(`· ${document.title}: migrado`);
    } catch {
      console.log(`· ${document.title}: no se pudo migrar (¿archivo ausente?)`);
    }
  }

  console.log(
    apply ? `\nMigrados: ${migrated}` : '\nInforme sin cambios. Añade `--apply` para migrar.'
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
