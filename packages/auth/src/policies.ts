import type { Role } from './roles';

export interface Policy {
  role: Role;
  can: (action: string, resource?: string) => boolean;
}

/** Creates a simple policy: allows a fixed set of actions per role. */
export function createPolicy(role: Role, allowedActions: string[]): Policy {
  return {
    role,
    can: (action) => allowedActions.includes(action),
  };
}
