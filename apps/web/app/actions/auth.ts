'use server';

import { redirect } from 'next/navigation';
import {
  auth,
  signIn,
  signOut,
  hashPassword,
  unstable_update,
  AuthError,
} from '@ifpc/auth';
import { isSignupRole } from '@ifpc/config';
import { prisma } from '@ifpc/database';
import {
  loginSchema,
  registerSchema,
  playerProfileSchema,
  coachOnboardingSchema,
  agentOnboardingSchema,
  clubOnboardingSchema,
  scoutOnboardingSchema,
  universityOnboardingSchema,
  schoolOnboardingSchema,
} from '@ifpc/validation';
import { createHash, randomBytes } from 'node:crypto';
import { sendPasswordResetEmail, sendVerificationEmail } from '@/lib/email/resend';
import { dashboardPath } from '@/lib/safe-redirect';
import { createRoleProfile, downloadRemoteAvatar } from '@/lib/signup';

/**
 * Arranca el flujo de Google. El `redirectTo` se valida como ruta interna del
 * dashboard para que un enlace manipulado no pueda sacar a nadie del sitio.
 */
export async function googleSignInAction(formData: FormData): Promise<void> {
  const callbackUrl = dashboardPath(formData.get('callbackUrl'));
  await signIn('google', { redirectTo: callbackUrl });
}

export interface ActionState {
  error?: string;
  success?: string;
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { error: 'Invalid email or password.' };
  }

  const callbackUrl = (formData.get('callbackUrl') as string) || '/dashboard';

  try {
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'Incorrect credentials. Please try again.' };
    }
    throw error;
  }

  return { error: '' };
}

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { error: 'Please review the form fields.' };
  }

  const rawRole = (formData.get('role') as string) ?? '';
  // De momento solo se pueden crear cuentas de jugador, entrenador y club.
  if (!isSignupRole(rawRole)) {
    return { error: 'Choose a valid account type.' };
  }
  const role = rawRole;

  const passwordHash = await hashPassword(parsed.data.password);
  const email = parsed.data.email.toLowerCase();
  const country = ((formData.get('country') as string) ?? '').trim() || 'Unspecified';

  let userId: string | null = null;
  try {
    userId = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: parsed.data.name,
          email,
          role,
          passwordHash,
          // El alta por email ya elige tipo de cuenta aquí mismo.
          onboardedAt: new Date(),
        },
      });
      await createRoleProfile(tx, {
        userId: user.id,
        role,
        name: parsed.data.name,
        email,
        country,
      });
      return user.id;
    });
  } catch {
    return { error: 'This email is already registered.' };
  }

  // Verifiestion email (does not block registration; in dev the link is logged).
  if (userId) {
    try {
      const token = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(token).digest('hex');
      await prisma.emailVerificationToken.create({
        data: {
          userId,
          tokenHash,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
      const verifyUrl = `${appUrl}/verify-email?token=${token}`;
      const result = await sendVerificationEmail(email, verifyUrl);
      if (!result.ok) {
        console.log(`[auth] verification link: ${verifyUrl}`);
      }
    } catch (error) {
      console.error('[auth] could not create the verification token', error);
    }
  }

  try {
    await signIn('credentials', {
      email,
      password: parsed.data.password,
      redirectTo: `/onboarding/${role.toLowerCase()}`,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'Could not sign in automatically.' };
    }
    throw error;
  }

  return { error: '' };
}

/**
 * Alta con Google: el callback `signIn` ya creó la cuenta (con `onboardedAt` nulo
 * y sin perfil de rol). Aquí la persona elige su tipo de cuenta, se crea el
 * perfil, se marca la cuenta como completada, se refresca la sesión —para que deje
 * de decir PLAYER— y entra al dashboard con la animación de bienvenida.
 */
export async function completeSignupAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Invalid session.' };
  }

  const rawRole = (formData.get('role') as string) ?? '';
  if (!isSignupRole(rawRole)) {
    return { error: 'Choose a valid account type.' };
  }
  const role = rawRole;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      onboardedAt: true,
    },
  });
  if (!user) {
    return { error: 'User not found.' };
  }
  if (user.onboardedAt) {
    redirect(`/dashboard/${user.role.toLowerCase()}`);
  }

  const country = ((formData.get('country') as string) ?? '').trim() || 'Unspecified';

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { role } });
      await createRoleProfile(tx, {
        userId: user.id,
        role,
        name: user.name,
        email: user.email,
        country,
      });
    });
  } catch {
    return { error: 'Your account could not be completed. Please try again.' };
  }

  // La foto del proveedor se copia a disco; si falla, la persona se queda con sus
  // iniciales y puede subir una desde Ajustes.
  const avatar = user.image ?? (await downloadRemoteAvatar(session.user.image));
  await prisma.user.update({
    where: { id: user.id },
    data: { onboardedAt: new Date(), ...(avatar ? { image: avatar } : {}) },
  });

  // La sesión nació con el rol por defecto: se refresca para que el middleware y
  // el dashboard usen el rol elegido sin obligar a volver a iniciar sesión.
  await unstable_update({ user: { role } });

  redirect(`/dashboard/${role.toLowerCase()}?welcome=1`);
}

export async function completeOnboardingAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Invalid session.' };
  }
  const userId = session.user.id;
  const role = (formData.get('role') as string) ?? '';

  const str = (key: string): string | null => {
    const value = formData.get(key);
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  };
  const num = (key: string): number | null => {
    const value = formData.get(key);
    if (typeof value !== 'string' || !value.trim()) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };

  try {
    switch (role) {
      case 'player': {
        const parsed = playerProfileSchema.safeParse({
          firstName: str('firstName') ?? undefined,
          lastName: str('lastName') ?? undefined,
          dateOfBirth: str('dateOfBirth') ?? undefined,
          nationality: str('nationality'),
          position: str('position'),
          foot: str('foot'),
          heightCm: num('heightCm'),
          weightKg: num('weightKg'),
          bio: null,
          clubName: null,
        });
        if (!parsed.success) return { error: 'Check the profile details.' };
        const { dateOfBirth, ...rest } = parsed.data;
        await prisma.player.update({
          where: { userId },
          data: { ...rest, dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null },
        });
        break;
      }
      case 'coach': {
        const parsed = coachOnboardingSchema.safeParse({ clubName: str('clubName') });
        if (!parsed.success) return { error: 'Invalid data.' };
        await prisma.coach.update({ where: { userId }, data: parsed.data });
        break;
      }
      case 'agent': {
        const parsed = agentOnboardingSchema.safeParse({
          agency: str('agency'),
          license: str('license'),
        });
        if (!parsed.success) return { error: 'Invalid data.' };
        await prisma.agent.update({ where: { userId }, data: parsed.data });
        break;
      }
      case 'club': {
        const parsed = clubOnboardingSchema.safeParse({
          name: str('name') ?? undefined,
          country: str('country') ?? undefined,
          city: str('city'),
          league: str('league'),
          description: str('description'),
        });
        if (!parsed.success) return { error: 'Check the club details.' };
        await prisma.club.update({ where: { userId }, data: parsed.data });
        break;
      }
      case 'parent':
        // Sin campos obligatorios en esta fase.
        break;
      case 'scout': {
        const parsed = scoutOnboardingSchema.safeParse({ agency: str('agency') });
        if (!parsed.success) return { error: 'Invalid data.' };
        await prisma.scout.update({ where: { userId }, data: parsed.data });
        break;
      }
      case 'university': {
        const parsed = universityOnboardingSchema.safeParse({
          name: str('name') ?? undefined,
          country: str('country') ?? undefined,
          city: str('city'),
          description: str('description'),
        });
        if (!parsed.success) return { error: 'Check the university details.' };
        await prisma.university.update({ where: { userId }, data: parsed.data });
        break;
      }
      case 'school': {
        const parsed = schoolOnboardingSchema.safeParse({
          name: str('name') ?? undefined,
          type: str('type'),
          country: str('country') ?? undefined,
          city: str('city'),
          contactName: str('contactName'),
          website: str('website'),
          description: str('description'),
        });
        if (!parsed.success) return { error: 'Check the school details.' };
        const { type, ...schoolData } = parsed.data;
        await prisma.school.update({
          where: { userId },
          data: { ...schoolData, ...(type ? { type } : {}) },
        });
        break;
      }
      default:
        return { error: 'Invalid onboarding role.' };
    }
  } catch {
    return { error: 'Could not save the information.' };
  }

  redirect(`/dashboard/${role}`);
  return { error: '' };
}

export async function forgotPasswordAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = ((formData.get('email') as string) ?? '').toLowerCase().trim();
  if (!email) {
    return { error: 'Enter your email.' };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { success: 'If the email exists, you will receive a link to reset your password.' };
  }

  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  const result = await sendPasswordResetEmail(user.email, resetUrl);
  if (result.ok) {
    return {
      success: 'Check your email: we have sent you a link to reset your password.',
    };
  }

  // Without Resend configured: in development the link stays visible in the console.
  console.log(`[auth] recovery link: ${resetUrl}`);
  return {
    success:
      'Check your email. (In development without Resend configured, the link is shown in the server console).',
  };
}

export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const token = (formData.get('token') as string) ?? '';
  const password = (formData.get('password') as string) ?? '';
  if (!token || password.length < 8) {
    return { error: 'Invalid link or password too short.' };
  }

  const tokenHash = createHash('sha256').update(token).digest('hex');
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { error: 'The link is not valid or has expired.' };
  }

  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  return { success: 'Password updated. You can now sign in.' };
}

/** Resends the verification email to the authenticated user. */
export async function resendVerificationEmailAction(): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Invalid session.' };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: 'User not found.' };
  if (user.emailVerified) return { success: 'Your email is already verified.' };

  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  await prisma.emailVerificationToken.create({
    data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const verifyUrl = `${appUrl}/verify-email?token=${token}`;
  const result = await sendVerificationEmail(user.email, verifyUrl);
  if (result.ok) {
    return { success: 'We have sent you a new verification link to your email.' };
  }

  console.log(`[auth] verification link: ${verifyUrl}`);
  return {
    success: `Check your email. (In development without Resend configured, link: ${verifyUrl})`,
  };
}

export async function signOutAction() {
  await signOut({ redirectTo: '/login' });
}
