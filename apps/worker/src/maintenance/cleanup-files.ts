import { readdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import type { Job } from 'bullmq';
import { prisma } from '@ifpc/database';

/** Deletes local upload files that are not referenced by any video. */
export async function cleanupFiles(job: Job) {
  const uploadsDir =
    process.env.UPLOAD_DIR ?? path.resolve(process.cwd(), '..', 'web', 'public', 'uploads');

  let files: string[] = [];
  try {
    files = await readdir(uploadsDir);
  } catch {
    return { cleaned: 0, reason: 'directorio de uploads no existe' };
  }

  const videos = await prisma.video.findMany({ where: { url: { startsWith: '/uploads/' } } });
  const referenced = new Set(videos.map((video) => path.basename(video.url)));

  let cleaned = 0;
  for (const file of files) {
    if (!referenced.has(file)) {
      await unlink(path.join(uploadsDir, file));
      cleaned += 1;
    }
  }

  console.log(`[maintenance] orphan files cleaned: ${cleaned}`);
  return { cleaned, total: files.length };
}
