import type { Job } from 'bullmq';

export interface ProcessEventsJobData {
  eventName: string;
  payload: Record<string, unknown>;
}

export async function processEvents(job: Job<ProcessEventsJobData>) {
  const { eventName, payload } = job.data;

  // Analytics phase: persistence in a dedicated store when available.
  // De momento se registra el evento con marca temporal para consumo posterior.
  console.log(
    `[analytics] ${eventName} ${new Date().toISOString()}`,
    JSON.stringify(payload)
  );
  return { eventName, processedAt: new Date().toISOString() };
}
