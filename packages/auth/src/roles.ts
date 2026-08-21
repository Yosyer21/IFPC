import type { Role } from '@future-buller/types';

export type { Role };

export const ROLES: readonly Role[] = [
  'PLAYER',
  'PARENT',
  'COACH',
  'SCOUT',
  'AGENT',
  'CLUB',
  'UNIVERSITY',
  'ADMIN',
];

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}
