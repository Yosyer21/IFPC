import { Queue } from 'bullmq';
import { redisConnection } from '../services/queue-service';

export const matchingQueue = new Queue('matching', { connection: redisConnection });
