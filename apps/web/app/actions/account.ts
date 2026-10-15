'use server';

import { redirect } from 'next/navigation';
import { createHash, randomBytes } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { auth, hashPassword, verifyPassword } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { changePasswordSchema, updateEmailSchema } from '@ifpc/validation';
import { sendVerificationEmail } from '@/lib/email/resend';
import { dashboardPath } from '@/lib/safe-redirect';
import type { ActionState } from './auth';

/** Accepted profile photo types mapped to the extension we store them with. */
const PHOTO_MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

/** Absolute directory holding profile photos inside the public uploads folder. */
const PHOTO_DIR = path.join(process.cwd(), 'public', 'uploads', 'photos');

/** Best-effort removal of a previously uploaded local photo (never throws). */
async function removeLocalPhoto(image: string | null): Promise<void> {
  if (!image?.startsWith('/uploads/photos/')) return;
  try {
    await unlink(path.join(process.cwd(), 'public', image.replace(/^\//, '')));
  } catch {
    // The file may already be gone: nothing to clean up.
  }
}

/**
 * Sube/reemplaza la foto de perfil del usuario autenticado (`User.image`), el
 * campo que renderiza el avatar compartido. Sirve para **cualquier rol**.
 */
export async function updateProfilePhotoAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Invalid session.' };
  }

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Select an image.' };
  }
  const ext = PHOTO_MIME_EXT[file.type];
  if (!ext) {
    return { error: 'Only JPG, PNG or WebP images are allowed.' };
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return { error: 'The image must be under 2 MB.' };
  }

  const backTo = dashboardPath(formData.get('redirectTo'));

  try {
    const previous = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true },
    });
    await mkdir(PHOTO_DIR, { recursive: true });
    const filename = `${crypto.randomUUID()}.${ext}`;
    await writeFile(path.join(PHOTO_DIR, filename), Buffer.from(await file.arrayBuffer()));
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: `/uploads/photos/${filename}` },
    });
    await removeLocalPhoto(previous?.image ?? null);
  } catch {
    return { error: 'The photo could not be saved.' };
  }

  redirect(backTo);
}

/** Quita la foto de perfil del usuario autenticado (y el fichero local). */
export async function removeProfilePhotoAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { image: true },
  });
  await prisma.user.update({ where: { id: session.user.id }, data: { image: null } });
  await removeLocalPhoto(user?.image ?? null);

  redirect(dashboardPath(formData.get('redirectTo')));
}

/**
 * Crea un enlace de verificación para el usuario (mismo patrón que el registro:
 * token aleatorio de 32 bytes, hash en BD y 24 h de validez) y lo manda por email.
 */
async function issueVerificationLink(userId: string, email: string) {
  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  await prisma.emailVerificationToken.create({
    data: { userId, tokenHash, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const verifyUrl = `${appUrl}/verify-email?token=${token}`;
  const result = await sendVerificationEmail(email, verifyUrl);
  if (!result.ok) {
    // Sin Resend configurado el enlace queda en la consola del servidor (desarrollo).
    console.log(`[account] verification link: ${verifyUrl}`);
  }
  return result;
}

/**
 * Cambia el email de la cuenta (`User.email`) desde Ajustes.
 *
 * Pide la contraseña actual —cuando la cuenta tiene— para que una sesión robada no
 * pueda llevarse la cuenta cambiando el correo, y deja el email **sin verificar**:
 * se manda un enlace a la dirección nueva (`/verify-email?token=…`).
 */
export async function changeEmailAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Invalid session.' };
  }

  const parsed = updateEmailSchema.safeParse({
    email: String(formData.get('email') ?? '')
      .trim()
      .toLowerCase(),
    currentPassword: String(formData.get('currentPassword') ?? ''),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Enter a valid email address.' };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, passwordHash: true },
  });
  if (!user) {
    return { error: 'User not found.' };
  }
  if (parsed.data.email === user.email.toLowerCase()) {
    return { error: 'That is already your email address.' };
  }
  if (user.passwordHash) {
    if (!parsed.data.currentPassword) {
      return { error: 'Confirm your password to change the email.' };
    }
    if (!(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
      return { error: 'The password is not correct.' };
    }
  }

  const taken = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (taken) {
    return { error: 'That email is already used by another account.' };
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { email: parsed.data.email, emailVerified: null },
    });
    // Los enlaces pendientes iban a la dirección anterior: dejan de valer.
    await prisma.emailVerificationToken.deleteMany({ where: { userId: session.user.id } });
    const sent = await issueVerificationLink(session.user.id, parsed.data.email);
    return {
      success: sent.ok
        ? `We sent a verification link to ${parsed.data.email}. Open it to confirm the new address.`
        : 'Email updated. The verification email could not be sent (the link is in the server console).',
    };
  } catch {
    return { error: 'The email could not be updated.' };
  }
}

/**
 * Cambia la contraseña (pidiendo la actual como prueba) o la **crea** cuando la
 * cuenta todavía no tiene ninguna (`passwordHash` vacío). Al cambiarla se invalidan
 * los enlaces de recuperación que estuvieran pendientes.
 */
export async function changePasswordAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Invalid session.' };
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: String(formData.get('currentPassword') ?? ''),
    newPassword: String(formData.get('newPassword') ?? ''),
    confirmPassword: String(formData.get('confirmPassword') ?? ''),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the new password.' };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });
  if (!user) {
    return { error: 'User not found.' };
  }

  if (user.passwordHash) {
    if (!parsed.data.currentPassword) {
      return { error: 'Enter your current password.' };
    }
    if (!(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
      return { error: 'The current password is not correct.' };
    }
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);

  try {
    await prisma.$transaction([
      prisma.user.update({ where: { id: session.user.id }, data: { passwordHash } }),
      prisma.passwordResetToken.deleteMany({ where: { userId: session.user.id, usedAt: null } }),
    ]);
  } catch {
    return { error: 'The password could not be updated.' };
  }

  return {
    success: user.passwordHash
      ? 'Password updated.'
      : 'Password created. You can now sign in with your email and password.',
  };
}
