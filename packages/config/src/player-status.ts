export const PLAYER_STATUSES = ['PENDING_VERIFICATION', 'ACTIVE', 'AVAILABLE', 'INACTIVE'] as const;
export type PlayerStatus = (typeof PLAYER_STATUSES)[number];

export const PLAYER_STATUS_LABELS: Record<PlayerStatus, string> = {
  PENDING_VERIFICATION: 'Pending verification',
  ACTIVE: 'Active',
  AVAILABLE: 'Available',
  INACTIVE: 'Inactive',
};
