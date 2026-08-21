export const ROLES = ['PLAYER', 'PARENT', 'COACH', 'SCOUT', 'AGENT', 'CLUB', 'UNIVERSITY', 'ADMIN'] as const;

export type Role = (typeof ROLES)[number];

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  image?: string | null;
  emailVerified?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
