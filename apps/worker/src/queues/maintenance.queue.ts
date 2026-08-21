import { Queue } from 'bullmq';
import { redisConnection } from '../services/queue-service';

export const maintenanceQueue = new Queue('maintenance', { connection: redisConnection });
