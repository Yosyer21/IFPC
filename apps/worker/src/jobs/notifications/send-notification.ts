import type { Job } from 'bullmq';
import { prisma } from '@future-buller/database';

export interface SendNotificationJobData {
  userId: string;
  type: string;
  title: string;
  message?: string;
  link?: string;
}

export async function sendNotification(job: Job<SendNotificationJobData>) {
  const { userId, type, title, message, link } = job.data;

  const notification = await prisma.notification.create({
    data: { userId, type, title, message, link },
  });

  // Fase email: envío vía Resend cuando RESEND_API_KEY esté configurado.
  console.log(`[notification] ${type} -> ${userId}: ${title}`);
  return { notificationId: notification.id, userId, type };
}
