import type { NextAuthConfig } from 'next-auth';
import type { Role } from '@ifpc/types';

/**
 * Configuración base de Auth.js (segura para edge).
 * El provider de credentials (que requiere base de datos) se añade en auth.ts.
 */
export const authConfig = {
  session: { strategy: 'jwt' },
  trustHost: true,
  pages: { signIn: '/login' },
  // El provider de credentials (requiere base de datos) se añade en auth.ts.
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
