import type { Job } from 'bullmq';
import { prisma } from '@ifpc/database';

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

  // Email phase: sending via Resend when RESEND_API_KEY is configured.
  console.log(`[notification] ${type} -> ${userId}: ${title}`);
  return { notificationId: notification.id, userId, type };
}
