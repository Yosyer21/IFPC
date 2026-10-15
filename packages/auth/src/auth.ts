import type {} from './next-auth';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { prisma } from '@ifpc/database';
import type { Role } from '@ifpc/types';
import { loginSchema } from '@ifpc/validation';
import { authConfig } from './auth.config';
import { isGoogleEnabled } from './google';

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),

    // El provider de Google se registra solo si hay credenciales
    // (AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET), igual que el botón: así «Google» en
    // /api/auth/providers significa que está configurado, y sin ellas la web
    // sigue funcionando con email.
    ...(isGoogleEnabled() ? [Google({})] : []),
  ],
  callbacks: {
    ...authConfig.callbacks,

    /**
     * Altas y accesos con Google. Como las sesiones son JWT y no hay adaptador de
     * Prisma, el usuario de la base hay que resolverlo aquí:
     *
     * - email nuevo → se crea la cuenta **sin perfil de rol** (`onboardedAt` nulo):
     *   la app le pedirá elegir tipo de cuenta antes de entrar al dashboard;
     * - email ya registrado y **verificado** → se vincula (Google ya lo verificó);
     * - email registrado pero sin verificar → no se vincula y se le manda a entrar
     *   con su contraseña: si no, alguien que se registró con un correo ajeno sin
     *   verificar perdería la cuenta en cuanto el dueño entrase con Google.
     */
    async signIn({ user, account }) {
      if (account?.provider !== 'google') return true;

      const email = user.email?.trim().toLowerCase();
      if (!email) return false;

      const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true, emailVerified: true },
      });

      if (!existing) {
        await prisma.user.create({
          data: {
            email,
            name: user.name?.trim() || email.split('@')[0] || email,
            // Google solo devuelve direcciones verificadas.
            emailVerified: new Date(),
          },
        });
        return true;
      }

      return existing.emailVerified ? true : '/login?error=EmailNotVerified';
    },

    /**
     * El token arranca con el perfil que da Google (que no conoce nuestra base):
     * aquí se resuelven el id y el rol reales. También atiende el refresco tras
     * elegir tipo de cuenta (`unstable_update`), para que la sesión deje de decir
     * PLAYER en cuanto la persona elige ser club o coach.
     */
    async jwt({ token, user, trigger, session }) {
      if (trigger === 'update') {
        // Acepta tanto `update({ role })` como `update({ user: { role } })`.
        const data = session as { role?: Role; user?: { role?: Role } } | undefined;
        const role = data?.role ?? data?.user?.role;
        return role ? { ...token, role } : token;
      }

      if (!user?.email) return token;

      const db = await prisma.user.findUnique({
        where: { email: user.email.trim().toLowerCase() },
        select: { id: true, role: true },
      });

      return db ? { ...token, id: db.id, role: db.role } : token;
    },
  },
});
