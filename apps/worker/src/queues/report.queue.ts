import { Queue } from 'bullmq';
import { redisConnection } from '../services/queue-service';

export const reportQueue = new Queue('report', { connection: redisConnection });
