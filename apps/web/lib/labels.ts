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

export const SCHOOL_TYPE_LABELS: Record<string, string> = {
  SCHOOL: 'Escuela / Colegio',
  COMMUNITY_SERVICE: 'Servicio comunitario',
};

/** Player development categories (`Evaluation.category`). */
export const CATEGORY_LABELS: Record<string, string> = {
  technical: 'Technique',
  physical: 'Physical',
  tactical: 'Tactics',
  psychological: 'Psychological',
};

/** Player goal status (`PlayerGoal.status`). */
export const GOAL_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En curso',
  completed: 'Completed',
};

/** Política de comentarios de una publicación (`Post.commentsPolicy`). */
export const COMMENTS_POLICY_LABELS: Record<string, string> = {
  EVERYONE: 'Cualquiera',
  FOLLOWERS: 'Solo quien me sigue',
  NOBODY: 'Nadie',
};

/** Acciones de la traza de moderación de Discovery (`ModerationLog.action`). */
export const MODERATION_ACTION_LABELS: Record<string, string> = {
  HIDDEN: 'Ocultada',
  PUBLISHED: 'Republicada',
  PINNED: 'Fijada',
  UNPINNED: 'Desfijada',
  DELETED: 'Borrada',
  RESOLVED: 'Denuncias atendidas',
};
