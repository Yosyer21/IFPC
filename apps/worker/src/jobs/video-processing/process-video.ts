import type { Job } from 'bullmq';
import { prisma } from '@ifpc/database';

export interface ProcessVideoJobData {
  videoId: string;
}

export async function processVideo(job: Job<ProcessVideoJobData>) {
  const { videoId } = job.data;

  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) {
    throw new Error(`Video ${videoId} no encontrado`);
  }

  // Fase transcoding real (ffmpeg + S3) pendiente: marcamos el vídeo como listo.
  await prisma.video.update({ where: { id: videoId }, data: { status: 'ready' } });

  console.log(`[video] video ${videoId} procesado`);
  return { videoId, status: 'ready' };
}
