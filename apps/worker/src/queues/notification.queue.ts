import { Queue } from 'bullmq';
import { redisConnection } from '../services/queue-service';

export const notificationQueue = new Queue('notification', { connection: redisConnection });
