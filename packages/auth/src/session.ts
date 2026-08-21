import type { Role } from './roles';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  image?: string | null;
}

export interface Session {
  user: SessionUser;
  expires: string;
}
