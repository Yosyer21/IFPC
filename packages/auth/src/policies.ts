import type { Role } from './roles';

export interface Policy {
  role: Role;
  can: (action: string, resource?: string) => boolean;
}

/** Crea una política simple: permite un conjunto fijo de acciones por rol. */
export function createPolicy(role: Role, allowedActions: string[]): Policy {
  return {
    role,
    can: (action) => allowedActions.includes(action),
  };
}
