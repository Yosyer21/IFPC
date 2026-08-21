import { Worker } from 'bullmq';
import type { Job } from 'bullmq';
import { redisConnection } from './queue-service';
import { maintenanceQueue } from '../queues/maintenance.queue';

import { processVideo } from '../jobs/video-processing/process-video';
import { calculateMatches } from '../jobs/matching/calculate-matches';
import { sendNotification } from '../jobs/notifications/send-notification';
import { generatePlayerReport } from '../jobs/reports/generate-player-report';
import { expireMemberships } from '../maintenance/expire-memberships';
import { cleanupFiles } from '../maintenance/cleanup-files';

type JobProcessor = (job: Job) => Promise<unknown>;

function startWorker(queueName: string, processor: JobProcessor) {
  const worker = new Worker(queueName, processor, { connection: redisConnection });
  worker.on('completed', (job) => console.log(`[worker] ${queueName}:${job.id} completado`));
  worker.on('failed', (job, error) =>
    console.error(`[worker] ${queueName}:${job?.id} falló`, error)
  );
  return worker;
}

/** Programa tareas de mantenimiento recurrentes (cron diario). */
async function scheduleMaintenance() {
  try {
    await maintenanceQueue.add('expire-memberships', {}, { repeat: { pattern: '0 3 * * *' } });
    await maintenanceQueue.add('cleanup-files', {}, { repeat: { pattern: '0 4 * * *' } });
    console.log('[worker] mantenimiento programado (expirar membresías 03:00, limpieza 04:00)');
  } catch (error) {
    console.warn('[worker] no se pudo programar mantenimiento (Redis no disponible)', error);
  }
}

startWorker('video', processVideo);
startWorker('matching', calculateMatches);
startWorker('notification', sendNotification);
startWorker('report', generatePlayerReport);

const maintenanceWorker = new Worker(
  'maintenance',
  async (job: Job) => {
    if (job.name === 'expire-memberships') return expireMemberships(job);
    if (job.name === 'cleanup-files') return cleanupFiles(job);
    return { ignored: job.name };
  },
  { connection: redisConnection }
);
maintenanceWorker.on('failed', (job, error) =>
  console.error(`[worker] maintenance:${job?.name} falló`, error)
);

void scheduleMaintenance();

