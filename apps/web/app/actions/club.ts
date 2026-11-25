'use server';

import { redirect } from 'next/navigation';
import { auth } from '@ifpc/auth';
import {
  PROFILE_BANNER_MAX_BYTES,
  PROFILE_BANNER_MIME_EXT,
  resolveProfileAccent,
  sanitizeClubProfileTags,
} from '@ifpc/config';
import { prisma } from '@ifpc/database';
import { clubProfileSchema, opportunitySchema } from '@ifpc/validation';
import type { ActionState } from './auth';
import { dashboardPath } from '@/lib/safe-redirect';
import { resolveStorage } from '@/lib/storage';
import { notifyUser } from '@/lib/notifications/notify';
import { revalidatePaths } from '@/lib/revalidate';
import { canContactPlayers } from '@/lib/verification';
import { isVisibleToClubs, needsParentApproval } from '@/lib/minor';

const str = (formData: FormData, key: string): string | null => {
  const value = formData.get(key);
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

const num = (formData: FormData, key: string): number | null => {
  const value = formData.get(key);
  if (typeof value !== 'string' || !value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

async function getClub() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.club.findUnique({ where: { userId: session.user.id } });
}

export async function createOpportunityAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const club = await getClub();
  if (!club) {
    return { error: 'Invalid club.' };
  }

  const parsed = opportunitySchema.safeParse({
    title: str(formData, 'title') ?? undefined,
    type: str(formData, 'type'),
    position: str(formData, 'position'),
    ageMin: num(formData, 'ageMin'),
    ageMax: num(formData, 'ageMax'),
    location: str(formData, 'location'),
    description: str(formData, 'description'),
    closesAt: str(formData, 'closesAt'),
  });
  if (!parsed.success) {
    return { error: 'Check the opportunity details.' };
  }

  const { closesAt, ...rest } = parsed.data;
  try {
    await prisma.opportunity.create({
      data: { ...rest, clubId: club.id, closesAt: closesAt ? new Date(closesAt) : null },
    });
  } catch {
    return { error: 'The opportunity could not be created.' };
  }

  redirect('/dashboard/club/opportunities');
}

export async function createRequirementAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const club = await getClub();
  if (!club) {
    return { error: 'Invalid club.' };
  }

  const title = str(formData, 'title');
  if (!title) {
    return { error: 'Title is required.' };
  }

  try {
    await prisma.requirement.create({
      data: {
        clubId: club.id,
        title,
        position: str(formData, 'position'),
        ageMin: num(formData, 'ageMin'),
        ageMax: num(formData, 'ageMax'),
        level: str(formData, 'level'),
        description: str(formData, 'description'),
      },
    });
  } catch {
    return { error: 'The requirement could not be created.' };
  }

  redirect('/dashboard/club/requirements');
}

export async function closeRequirementAction(formData: FormData): Promise<void> {
  const club = await getClub();
  if (!club) {
    return;
  }
  const requirementId = str(formData, 'requirementId');
  if (!requirementId) {
    return;
  }

  try {
    await prisma.requirement.update({
      where: { id: requirementId, clubId: club.id },
      data: { status: 'CLOSED' },
    });
  } catch {
    return;
  }

  redirect('/dashboard/club/requirements');
}

export async function respondInquiryAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const club = await getClub();
  if (!club) {
    return { error: 'Invalid club.' };
  }
  const inquiryId = str(formData, 'inquiryId');
  const response = str(formData, 'response');
  if (!inquiryId || !response) {
    return { error: 'The reply text is missing.' };
  }

  try {
    await prisma.inquiry.update({
      where: { id: inquiryId, clubId: club.id },
      data: { response, status: 'CLOSED', respondedAt: new Date() },
    });
  } catch {
    return { error: 'The reply could not be saved.' };
  }

  redirect(`/dashboard/club/inquiries/${inquiryId}`);
}

export async function inviteStaffAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const club = await getClub();
  if (!club) {
    return { error: 'Invalid club.' };
  }
  const email = str(formData, 'email');
  const role = str(formData, 'role') ?? 'STAFF';
  if (!email) {
    return { error: 'Email is required.' };
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    return { error: 'There is no registered user with that email.' };
  }

  try {
    await prisma.clubStaff.upsert({
      where: { clubId_userId: { clubId: club.id, userId: user.id } },
      update: { role },
      create: { clubId: club.id, userId: user.id, role },
    });
  } catch {
    return { error: 'The member could not be invited.' };
  }

  redirect('/dashboard/club/staff');
}

// ---------------------------------------------------------------------------
// Perfil del club (datos, portada, escudo, headline, chips y acento)
// ---------------------------------------------------------------------------

/** Prefijo de las portadas de club dentro del almacén (`/uploads/club-banners/…`). */
const CLUB_BANNER_KEY_PREFIX = 'club-banners/';
/** Prefijo de los escudos dentro del almacén (`/uploads/club-logos/…`). */
const CLUB_LOGO_KEY_PREFIX = 'club-logos/';

/**
 * Valida y guarda una imagen del club con `resolveStorage()`, así que funciona
 * igual con el disco local y con S3 (ver `apps/web/lib/storage`).
 */
async function saveClubImage(
  file: FormDataEntryValue | null,
  keyPrefix: string
): Promise<{ url: string } | { error: string }> {
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Select an image.' };
  }
  const ext = PROFILE_BANNER_MIME_EXT[file.type];
  if (!ext) {
    return { error: 'Only JPG, PNG or WebP images are allowed.' };
  }
  if (file.size > PROFILE_BANNER_MAX_BYTES) {
    return { error: 'The image must be under 4 MB.' };
  }

  try {
    const { url } = await resolveStorage().save({
      key: `${keyPrefix}${crypto.randomUUID()}.${ext}`,
      body: Buffer.from(await file.arrayBuffer()),
      contentType: file.type,
    });
    return { url };
  } catch {
    return { error: 'The image could not be saved.' };
  }
}

/**
 * Guarda el perfil público del club: datos, headline, chips y acento. El acento
 * se normaliza contra la paleta permitida y los chips contra
 * `CLUB_PROFILE_TAGS` (se descarta lo desconocido y se corta al máximo), igual
 * que hace `updatePlayerProfileAction` con el perfil del player.
 */
export async function updateClubProfileAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const club = await getClub();
  if (!club) {
    return { error: 'Invalid club.' };
  }

  const parsed = clubProfileSchema.safeParse({
    name: str(formData, 'name') ?? undefined,
    country: str(formData, 'country') ?? undefined,
    city: str(formData, 'city'),
    league: str(formData, 'league'),
    foundedYear: num(formData, 'foundedYear'),
    description: str(formData, 'description'),
    headline: str(formData, 'headline'),
    accentColor: resolveProfileAccent(str(formData, 'accentColor')),
    tags: sanitizeClubProfileTags(formData.getAll('tags')),
  });
  if (!parsed.success) {
    return { error: 'Please review the club data.' };
  }

  try {
    await prisma.club.update({ where: { id: club.id }, data: parsed.data });
  } catch {
    return { error: 'Could not save the club profile.' };
  }

  redirect('/dashboard/club/profile');
}

/**
 * Crea (o vincula) el perfil de club de un usuario con rol CLUB que todavía no
 * tiene fila `Club`. Evita el 404 del área del club en cuentas recién creadas o
 * a las que se les asignó el rol desde el admin.
 */
export async function createClubProfileAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'CLUB') {
    return { error: 'Invalid club.' };
  }

  const parsed = clubProfileSchema.safeParse({
    name: str(formData, 'name') ?? undefined,
    country: str(formData, 'country') ?? undefined,
    city: str(formData, 'city'),
    league: str(formData, 'league'),
    foundedYear: num(formData, 'foundedYear'),
    description: str(formData, 'description'),
  });
  if (!parsed.success) {
    return { error: 'Please review the club data: name and country are required.' };
  }

  try {
    const existing = await prisma.club.findUnique({ where: { userId: session.user.id } });
    if (existing) {
      await prisma.club.update({ where: { id: existing.id }, data: parsed.data });
    } else {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { email: true },
      });
      if (!user?.email) return { error: 'Your account has no email address.' };

      const byEmail = await prisma.club.findUnique({ where: { email: user.email } });
      if (byEmail) {
        await prisma.club.update({
          where: { id: byEmail.id },
          data: { ...parsed.data, userId: session.user.id },
        });
      } else {
        await prisma.club.create({
          data: { ...parsed.data, userId: session.user.id, email: user.email },
        });
      }
    }
  } catch {
    return { error: 'Could not create the club profile.' };
  }

  revalidatePaths('/dashboard/club', '/dashboard/club/profile');
  redirect('/dashboard/club');
}

/** Sube o reemplaza la portada del perfil (`Club.bannerUrl`). */
export async function updateClubBannerAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const club = await getClub();
  if (!club) {
    return { error: 'Invalid club.' };
  }

  const saved = await saveClubImage(formData.get('file'), CLUB_BANNER_KEY_PREFIX);
  if ('error' in saved) {
    return saved;
  }

  try {
    await prisma.club.update({ where: { id: club.id }, data: { bannerUrl: saved.url } });
    // La portada anterior se borra cuando la nueva ya está guardada (best-effort).
    await resolveStorage().remove(club.bannerUrl);
  } catch {
    return { error: 'The cover could not be saved.' };
  }

  redirect(dashboardPath(formData.get('redirectTo')));
}

/** Quita la portada del club y borra el fichero del almacén (best-effort). */
export async function removeClubBannerAction(formData: FormData): Promise<void> {
  const club = await getClub();
  if (!club) {
    return;
  }

  await prisma.club.update({ where: { id: club.id }, data: { bannerUrl: null } });
  await resolveStorage().remove(club.bannerUrl);

  redirect(dashboardPath(formData.get('redirectTo')));
}

/** Sube o reemplaza el escudo del club (`Club.logoUrl`). */
export async function updateClubLogoAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const club = await getClub();
  if (!club) {
    return { error: 'Invalid club.' };
  }

  const saved = await saveClubImage(formData.get('file'), CLUB_LOGO_KEY_PREFIX);
  if ('error' in saved) {
    return saved;
  }

  try {
    await prisma.club.update({ where: { id: club.id }, data: { logoUrl: saved.url } });
    // El escudo anterior se borra cuando el nuevo ya está guardado (best-effort).
    await resolveStorage().remove(club.logoUrl);
  } catch {
    return { error: 'The crest could not be saved.' };
  }

  redirect(dashboardPath(formData.get('redirectTo')));
}

/** Quita el escudo del club y borra el fichero del almacén (best-effort). */
export async function removeClubLogoAction(formData: FormData): Promise<void> {
  const club = await getClub();
  if (!club) {
    return;
  }

  await prisma.club.update({ where: { id: club.id }, data: { logoUrl: null } });
  await resolveStorage().remove(club.logoUrl);

  redirect(dashboardPath(formData.get('redirectTo')));
}

/** Vuelta a «Find players» conservando los filtros activos (nunca fuera del área). */
function clubPlayersBack(formData: FormData): string {
  const raw = str(formData, 'returnTo');
  return raw && raw.startsWith('/dashboard/club/players') ? raw : '/dashboard/club/players';
}

/**
 * Añade o quita un jugador de la shortlist del club (scouting). Es un toggle
 * idempotente: si ya estaba, lo quita; si no, lo guarda.
 */
export async function toggleClubShortlistAction(formData: FormData): Promise<void> {
  const club = await getClub();
  if (!club) {
    return;
  }

  const playerId = str(formData, 'playerId');
  if (!playerId) {
    redirect(clubPlayersBack(formData));
  }

  const existing = await prisma.clubShortlist.findUnique({
    where: { clubId_playerId: { clubId: club.id, playerId } },
  });

  if (existing) {
    await prisma.clubShortlist.delete({ where: { id: existing.id } });
  } else {
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: {
        id: true,
        dateOfBirth: true,
        parents: { select: { idVisibleToClubs: true } },
      },
    });
    if (player && isVisibleToClubs(player.dateOfBirth, player.parents)) {
      await prisma.clubShortlist.create({ data: { clubId: club.id, playerId } });
    }
  }

  revalidatePaths('/dashboard/club/players');
  redirect(clubPlayersBack(formData));
}

/** Días hasta la prueba cuando el club invita desde «Find players». */
const TRIAL_INVITE_DAYS = 7;

/**
 * Invita a un jugador a una prueba. Crea un `Trial` (SCHEDULED) la primera vez,
 * avisa al jugador y a su familia, y es **idempotente**: si ya hay una prueba
 * programada con ese club, no duplica nada.
 */
export async function invitePlayerToTrialAction(formData: FormData): Promise<void> {
  const club = await getClub();
  if (!club) {
    return;
  }

  // Safeguarding: solo un club verificado y con antecedentes puede invitar.
  if (
    !canContactPlayers({
      verified: club.verified,
      backgroundChecked: club.backgroundChecked,
    })
  ) {
    redirect(clubPlayersBack(formData));
  }

  const playerId = str(formData, 'playerId');
  if (!playerId) {
    redirect(clubPlayersBack(formData));
  }

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      userId: true,
      parents: {
        select: {
          idVisibleToClubs: true,
          parent: { select: { userId: true } },
        },
      },
    },
  });
  if (!player) {
    redirect(clubPlayersBack(formData));
  }
  // El padre puede ocultar el ID a clubes (menores de 16): no se invita a ciegas.
  if (!isVisibleToClubs(player.dateOfBirth, player.parents)) {
    redirect(clubPlayersBack(formData));
  }

  const existing = await prisma.trial.findFirst({
    where: { clubId: club.id, playerId, status: 'SCHEDULED' },
  });

  if (!existing) {
    const startsAt = new Date(Date.now() + TRIAL_INVITE_DAYS * 86_400_000);
    startsAt.setUTCHours(10, 0, 0, 0);
    // Menores de 16 con padre vinculado: primero decide la familia.
    const requiresParent = needsParentApproval(player.dateOfBirth, player.parents);

    await prisma.trial.create({
      data: {
        clubId: club.id,
        playerId,
        startsAt,
        location: club.city ?? club.country,
        status: 'SCHEDULED',
        parentApproval: requiresParent ? 'PENDING' : 'NOT_REQUIRED',
        notes: 'Trial invitation sent from Find players.',
      },
    });

    try {
      await notifyUser({
        userId: player.userId,
        type: 'application',
        title: requiresParent ? 'Trial invitation — waiting for your parent' : 'Trial invitation',
        message: requiresParent
          ? `${club.name} has invited you to a trial. Your parent needs to approve it first.`
          : `${club.name} has invited you to a trial. Check your calendar.`,
        link: '/dashboard/player/opportunities',
      });
      for (const link of player.parents) {
        await notifyUser({
          userId: link.parent.userId,
          type: 'application',
          title: requiresParent ? 'Trial invitation to approve' : 'Trial invitation',
          message: `${club.name} has invited ${player.firstName} ${player.lastName} to a trial.`,
          link: requiresParent ? '/dashboard/parent/approvals' : '/dashboard/calendar',
        });
      }
    } catch {
      // La prueba ya está creada: un fallo del aviso no debe deshacerla.
    }
  }

  revalidatePaths(
    '/dashboard/club/players',
    '/dashboard/player/calendar',
    '/dashboard/calendar',
    '/dashboard/parent/approvals',
    '/dashboard/parent'
  );
  redirect(clubPlayersBack(formData));
}
