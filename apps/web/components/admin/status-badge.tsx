import { Badge } from '@future-buller/ui';

const SUCCESS = new Set([
  'ACCEPTED',
  'ACTIVE',
  'SIGNED',
  'COMPLETED',
  'OPEN',
  'PAID',
  'AVAILABLE',
  'VERIFIED',
]);

const WARNING = new Set([
  'PENDING',
  'SCHEDULED',
  'PENDING_SIGNATURE',
  'IN_REVIEW',
  'ONGOING',
  'IN_PROGRESS',
  'NEW',
  'DRAFT',
  'SUBMISSION',
  'TRIAL',
  'NEGOTIATION',
  'CONTRACT',
]);

const DANGER = new Set([
  'REJECTED',
  'CANCELLED',
  'TERMINATED',
  'EXPIRED',
  'NO_SHOW',
  'FAILED',
  'CLOSED',
  'WITHDRAWN',
  'INACTIVE',
]);

export function statusVariant(status: string): 'default' | 'success' | 'warning' | 'danger' {
  if (SUCCESS.has(status)) return 'success';
  if (WARNING.has(status)) return 'warning';
  if (DANGER.has(status)) return 'danger';
  return 'default';
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={statusVariant(status)}>{status}</Badge>;
}
