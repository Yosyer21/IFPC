import { Queue } from 'bullmq';
import { redisConnection } from '../services/queue-service';

export const videoQueue = new Queue('video', { connection: redisConnection });
