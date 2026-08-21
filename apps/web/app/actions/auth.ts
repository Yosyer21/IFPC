'use server';

import { redirect } from 'next/navigation';
import { auth, signIn, signOut, isRole, hashPassword, AuthError } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import {
  loginSchema,
  registerSchema,
  playerProfileSchema,
  coachOnboardingSchema,
  agentOnboardingSchema,
  clubOnboardingSchema,
} from '@future-buller/validation';
import type { Role } from '@future-buller/types';
import { createHash, randomBytes } from 'node:crypto';
import { sendPasswordResetEmail, sendVerificationEmail } from '@/lib/email/resend';

export interface ActionState {
  error?: string;
  success?: string;
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { error: 'Email o contraseña no válidos.' };
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
      return { error: 'Credenciales incorrectas. Inténtalo de nuevo.' };
    }
    throw error;
  }

  return { error: '' };
}

export async function registerAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { error: 'Revisa los datos del formulario.' };
  }

  const rawRole = (formData.get('role') as string) ?? '';
  if (!isRole(rawRole)) {
    return { error: 'Tipo de cuenta no válido.' };
  }
  const role: Role = rawRole;

  const passwordHash = await hashPassword(parsed.data.password);
  const email = parsed.data.email.toLowerCase();
  const country = ((formData.get('country') as string) ?? '').trim() || 'Sin especificar';

  let userId: string | null = null;
  try {
    userId = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name: parsed.data.name, email, role, passwordHash },
      });
      switch (role) {
        case 'PLAYER':
          await tx.player.create({
            data: { userId: user.id, firstName: parsed.data.name, lastName: '' },
          });
          break;
        case 'PARENT':
          await tx.parent.create({ data: { userId: user.id } });
          break;
        case 'COACH':
          await tx.coach.create({ data: { userId: user.id } });
          break;
        case 'SCOUT':
          await tx.scout.create({ data: { userId: user.id } });
          break;
        case 'AGENT':
          await tx.agent.create({ data: { userId: user.id } });
          break;
        case 'CLUB':
          await tx.club.create({
            data: { userId: user.id, email, name: parsed.data.name, country },
          });
          break;
        default:
          break;
      }
      return user.id;
    });
  } catch {
    return { error: 'El email ya está registrado.' };
  }

  // Email de verificación (no bloquea el registro; en dev el enlace se loguea).
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
        console.log(`[auth] enlace de verificación: ${verifyUrl}`);
      }
    } catch (error) {
      console.error('[auth] no se pudo crear el token de verificación', error);
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
      return { error: 'No se pudo iniciar sesión automáticamente.' };
    }
    throw error;
  }

  return { error: '' };
}

export async function completeOnboardingAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Sesión no válida.' };
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
        if (!parsed.success) return { error: 'Revisa los datos del perfil.' };
        const { dateOfBirth, ...rest } = parsed.data;
        await prisma.player.update({
          where: { userId },
          data: { ...rest, dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null },
        });
        break;
      }
      case 'coach': {
        const parsed = coachOnboardingSchema.safeParse({ clubName: str('clubName') });
        if (!parsed.success) return { error: 'Datos no válidos.' };
        await prisma.coach.update({ where: { userId }, data: parsed.data });
        break;
      }
      case 'agent': {
        const parsed = agentOnboardingSchema.safeParse({
          agency: str('agency'),
          license: str('license'),
        });
        if (!parsed.success) return { error: 'Datos no válidos.' };
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
        if (!parsed.success) return { error: 'Revisa los datos del club.' };
        await prisma.club.update({ where: { userId }, data: parsed.data });
        break;
      }
      case 'parent':
        // Sin campos obligatorios en esta fase.
        break;
      default:
        return { error: 'Rol de onboarding no válido.' };
    }
  } catch {
    return { error: 'No se pudo guardar la información.' };
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
    return { error: 'Introduce tu email.' };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { success: 'Si el email existe, recibirás un enlace para restablecer la contraseña.' };
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
      success: 'Revisa tu email: te hemos enviado un enlace para restablecer la contraseña.',
    };
  }

  // Sin Resend configurado: en desarrollo el enlace queda visible en la consola.
  console.log(`[auth] enlace de recuperación: ${resetUrl}`);
  return {
    success:
      'Revisa tu email. (En desarrollo sin Resend configurado, el enlace se muestra en la consola del servidor).',
  };
}

export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const token = (formData.get('token') as string) ?? '';
  const password = (formData.get('password') as string) ?? '';
  if (!token || password.length < 8) {
    return { error: 'Enlace no válido o contraseña demasiado corta.' };
  }

  const tokenHash = createHash('sha256').update(token).digest('hex');
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { error: 'El enlace no es válido o ha caducado.' };
  }

  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  return { success: 'Contraseña actualizada. Ya puedes iniciar sesión.' };
}

/** Reenvía el email de verificación al usuario autenticado. */
export async function resendVerificationEmailAction(): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Sesión no válida.' };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: 'Usuario no encontrado.' };
  if (user.emailVerified) return { success: 'Tu email ya está verificado.' };

  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  await prisma.emailVerificationToken.create({
    data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const verifyUrl = `${appUrl}/verify-email?token=${token}`;
  const result = await sendVerificationEmail(user.email, verifyUrl);
  if (result.ok) {
    return { success: 'Te hemos enviado un nuevo enlace de verificación a tu email.' };
  }

  console.log(`[auth] enlace de verificación: ${verifyUrl}`);
  return {
    success: `Revisa tu email. (En desarrollo sin Resend configurado, enlace: ${verifyUrl})`,
  };
}

export async function signOutAction() {
  await signOut({ redirectTo: '/login' });
}
