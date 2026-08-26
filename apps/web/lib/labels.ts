/** Shared domain labels (do not export constants from `page.tsx` files). */

export const SESSION_TYPE_LABELS: Record<string, string> = {
  TRAINING: 'Training',
  LECTURE: 'Lecture',
  Q_AND_A: 'Q&A',
  TRIAL: 'Trial',
};

export const LIVE_SESSION_TYPE_LABELS: Record<string, string> = SESSION_TYPE_LABELS;

export const LIVE_SESSION_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Scheduled',
  LIVE: 'Live',
  ENDED: 'Ended',
  CANCELLED: 'Cancelled',
};

export const CAMP_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  OPEN: 'Open',
  FULL: 'Full',
  CANCELLED: 'Cancelled',
  FINISHED: 'Finished',
};
