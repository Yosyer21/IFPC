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

export const LIVE_SESSION_VISIBILITY_LABELS: Record<string, string> = {
  CLUB: 'Club only',
  PUBLIC: 'Public (Discovery)',
};

export const CAMP_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  OPEN: 'Open',
  FULL: 'Full',
  CANCELLED: 'Cancelled',
  FINISHED: 'Finished',
};

export const SCHOOL_TYPE_LABELS: Record<string, string> = {
  SCHOOL: 'School / College',
  COMMUNITY_SERVICE: 'Community service',
};

/** Player development categories (`Evaluation.category`). */
export const CATEGORY_LABELS: Record<string, string> = {
  technical: 'Technique',
  physical: 'Physical',
  tactical: 'Tactics',
  psychological: 'Psychological',
};

/** Content categories (`TrainingContent.category`). */
export const TRAINING_CATEGORY_LABELS: Record<string, string> = {
  technical: 'Technique',
  'strength-conditioning': 'Strength & conditioning',
  psychology: 'Psychology',
  'parent-education': 'For families',
};

/** Player goal status (`PlayerGoal.status`). */
export const GOAL_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In progress',
  completed: 'Completed',
};

/** Política de comments de una post (`Post.commentsPolicy`). */
export const COMMENTS_POLICY_LABELS: Record<string, string> = {
  EVERYONE: 'Everyone',
  FOLLOWERS: 'Followers only',
  NOBODY: 'Nobody',
};

/** Acciones de la traza de moderación de Discovery (`ModerationLog.action`). */
export const MODERATION_ACTION_LABELS: Record<string, string> = {
  HIDDEN: 'Hidden',
  PUBLISHED: 'Republished',
  PINNED: 'Pinned',
  UNPINNED: 'Unpinned',
  DELETED: 'Deleted',
  RESOLVED: 'Reports resolved',
};
