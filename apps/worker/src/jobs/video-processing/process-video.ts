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

  // Real transcoding phase (ffmpeg + S3) pending: we mark the video as ready.
  await prisma.video.update({ where: { id: videoId }, data: { status: 'ready' } });

  console.log(`[video] video ${videoId} procesado`);
  return { videoId, status: 'ready' };
}
