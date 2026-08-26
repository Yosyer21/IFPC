import type { NextAuthConfig } from 'next-auth';
import type { Role } from '@ifpc/types';

/**
 * Base Auth.js configuration (edge-safe).
 * The credentials provider (requires a database) is added in auth.ts.
 */
export const authConfig = {
  session: { strategy: 'jwt' },
  trustHost: true,
  pages: { signIn: '/login' },
  // The credentials provider (requires a database) is added in auth.ts.
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as Role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? '';
        session.user.role = (token.role as Role) ?? 'PLAYER';
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
