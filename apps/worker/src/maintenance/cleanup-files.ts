import { readdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import type { Job } from 'bullmq';
import { prisma } from '@ifpc/database';

/**
 * Borra los archivos subidos que ya no referencia nadie: vídeos del perfil y
 * **medio de las publicaciones** (`mediaUrl` y la galería `mediaUrls`, que vive
 * en `uploads/posts/`). Se ignoran los directorios para no intentar borrar la
 * carpeta `posts/`.
 */
export async function cleanupFiles(job: Job) {
  const uploadsDir =
    process.env.UPLOAD_DIR ?? path.resolve(process.cwd(), '..', 'web', 'public', 'uploads');

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
  let total = 0;
  for (const dir of [uploadsDir, path.join(uploadsDir, 'posts')]) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      total += 1;
      if (referenced.has(entry.name)) continue;

      try {
        await unlink(path.join(dir, entry.name));
        cleaned += 1;
      } catch {
        // Un archivo que no se puede borrar no debe cortar la limpieza.
      }
    }
  }

  console.log(`[maintenance] orphan files cleaned: ${cleaned}`);

  if (total === 0) {
    return { cleaned: 0, reason: 'directorio de uploads no existe' };
  }
  return { cleaned, total };
}

