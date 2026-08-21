import { readdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '@future-buller/database';

async function main() {
  const uploadsDir = process.env.UPLOAD_DIR ?? path.resolve('apps', 'web', 'public', 'uploads');

  let files: string[] = [];
  try {
    files = await readdir(uploadsDir);
  } catch {
    console.log('El directorio de uploads no existe, nada que limpiar.');
    return;
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
  console.log(`Archivos huérfanos eliminados: ${cleaned}`);
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
