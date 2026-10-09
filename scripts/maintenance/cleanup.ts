// Borra los archivos subidos que ya no referencia nadie (vídeos de perfil y
// medio de las publicaciones, incluida la galería `mediaUrls`).
import { readdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '@ifpc/database';

async function main() {
  const uploadsDir = process.env.UPLOAD_DIR ?? path.resolve('apps', 'web', 'public', 'uploads');

  const videos = await prisma.video.findMany({ where: { url: { startsWith: '/uploads/' } } });
  const posts = await prisma.post.findMany({
    select: { mediaUrl: true, mediaUrls: true },
  });

  const referenced = new Set<string>();
  for (const video of videos) referenced.add(path.basename(video.url));
  for (const post of posts) {
    if (post.mediaUrl) referenced.add(path.basename(post.mediaUrl));
    for (const url of post.mediaUrls) referenced.add(path.basename(url));
  }

  let cleaned = 0;
  let scanned = 0;
  for (const dir of [uploadsDir, path.join(uploadsDir, 'posts')]) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      scanned += 1;
      if (referenced.has(entry.name)) continue;

      try {
        await unlink(path.join(dir, entry.name));
        cleaned += 1;
      } catch {
        // Un archivo que no se puede borrar no debe cortar la limpieza.
      }
    }
  }

  console.log(
    scanned === 0
      ? 'El directorio de uploads no existe, nada que limpiar.'
      : `Orphan files cleaned: ${cleaned} (revisados ${scanned})`
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


main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
