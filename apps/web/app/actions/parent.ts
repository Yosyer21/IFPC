'use server';

import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import type { ActionState } from './auth';
import { notifyUser } from '@/lib/notifications/notify';
import { revalidatePaths } from '@/lib/revalidate';

const checked = (formData: FormData, key: string): boolean => formData.get(key) === 'on';

const str = (formData: FormData, key: string): string | null => {
  const value = formData.get(key);
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

/**
 * Guarda la protección de un hijo desde el área del padre: consentimiento
 * parental, ficha médica y los interruptores de visibilidad del ID (libro §2).
 * Solo el padre vinculado al jugador puede cambiarlo.
 */
export async function updateChildProtectionAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Invalid session.' };
  }

  const playerId = formData.get('playerId');
  if (typeof playerId !== 'string' || !playerId) {
    return { error: 'Invalid child.' };
  }

  const parent = await prisma.parent.findUnique({ where: { userId: session.user.id } });
  if (!parent) {
    return { error: 'Parent profile not found.' };
  }

  const link = await prisma.parentChild.findUnique({
    where: { parentId_playerId: { parentId: parent.id, playerId } },
  });
  if (!link) {
    return { error: 'This child is not linked to your account.' };
  }

  const consentGiven = checked(formData, 'consentGiven');

  try {
    await prisma.parentChild.update({
      where: { parentId_playerId: { parentId: parent.id, playerId } },
      data: {
        consentGiven,
        consentAt: consentGiven ? (link.consentAt ?? new Date()) : null,
        medicalInfoRegistered: checked(formData, 'medicalInfoRegistered'),
        idVisibleToClubs: checked(formData, 'idVisibleToClubs'),
        idVisibleToSchools: checked(formData, 'idVisibleToSchools'),
        showStatsAndClips: checked(formData, 'showStatsAndClips'),
        allowDirectInvites: checked(formData, 'allowDirectInvites'),
      },
    });
  } catch {
    return { error: 'Could not save the protection settings.' };
  }

  revalidatePaths(
    `/dashboard/parent/children/${playerId}`,
    '/dashboard/parent/children',
    '/dashboard/parent'
  );
  return { success: 'Protection settings saved.' };
}

const APPROVAL_PATHS = [
  '/dashboard/parent/approvals',
  '/dashboard/parent',
  '/dashboard/player/opportunities',
  '/dashboard/player/calendar',
  '/dashboard/calendar',
  '/dashboard/club/players',
];

/** Decide una prueba pendiente de un hijo (solo el padre vinculado). */
export async function decideTrialApprovalAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const trialId = str(formData, 'trialId');
  if (!trialId) return;
  const decision = formData.get('decision') === 'approve' ? 'APPROVED' : 'DECLINED';

  const parent = await prisma.parent.findUnique({ where: { userId: session.user.id } });
  if (!parent) return;

  const trial = await prisma.trial.findFirst({
    where: {
      id: trialId,
      parentApproval: 'PENDING',
      status: 'SCHEDULED',
      player: { parents: { some: { parentId: parent.id } } },
    },
    include: {
      player: { select: { firstName: true, lastName: true, userId: true } },
      club: { select: { name: true, userId: true } },
    },
  });
  if (!trial) return;

  await prisma.trial.update({
    where: { id: trial.id },
    data: {
      parentApproval: decision,
      parentDecisionAt: new Date(),
      parentDecisionByUserId: session.user.id,
      ...(decision === 'DECLINED' ? { status: 'CANCELLED' } : {}),
    },
  });

  const playerName = `${trial.player.firstName} ${trial.player.lastName}`.trim();
  try {
    await notifyUser({
      userId: trial.player.userId,
      type: 'application',
      title: decision === 'APPROVED' ? 'Trial approved' : 'Trial declined',
      message:
        decision === 'APPROVED'
          ? `Your parent approved the ${trial.club.name} trial. Check your calendar.`
          : `Your parent declined the ${trial.club.name} trial.`,
      link: '/dashboard/player/opportunities',
    });
    if (trial.club.userId) {
      await notifyUser({
        userId: trial.club.userId,
        type: 'application',
        title: `Parent ${decision === 'APPROVED' ? 'approved' : 'declined'} a trial`,
        message: `${playerName} — ${trial.club.name}`,
        link: '/dashboard/club/players',
      });
    }
  } catch {
    // La decisión ya está guardada; el aviso no debe deshacerla.
  }

  revalidatePaths(...APPROVAL_PATHS);
}

/** Decide una oferta de contrato pendiente de un hijo. */
export async function decideNegotiationApprovalAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const negotiationId = str(formData, 'negotiationId');
  if (!negotiationId) return;
  const decision = formData.get('decision') === 'approve' ? 'APPROVED' : 'DECLINED';

  const parent = await prisma.parent.findUnique({ where: { userId: session.user.id } });
  if (!parent) return;

  const negotiation = await prisma.negotiation.findFirst({
    where: {
      id: negotiationId,
      parentApproval: 'PENDING',
      status: { in: ['OPEN', 'ONGOING'] },
      player: { parents: { some: { parentId: parent.id } } },
    },
    include: {
      player: { select: { firstName: true, lastName: true, userId: true } },
      club: { select: { name: true, userId: true } },
    },
  });
  if (!negotiation) return;

  await prisma.negotiation.update({
    where: { id: negotiation.id },
    data: {
      parentApproval: decision,
      parentDecisionAt: new Date(),
      parentDecisionByUserId: session.user.id,
      ...(decision === 'DECLINED' ? { status: 'REJECTED' } : {}),
    },
  });

  const playerName = `${negotiation.player.firstName} ${negotiation.player.lastName}`.trim();
  try {
    await notifyUser({
      userId: negotiation.player.userId,
      type: 'application',
      title: decision === 'APPROVED' ? 'Contract offer approved' : 'Contract offer declined',
      message:
        decision === 'APPROVED'
          ? `Your parent approved the ${negotiation.club.name} offer.`
          : `Your parent declined the ${negotiation.club.name} offer.`,
      link: '/dashboard/player/opportunities',
    });
    if (negotiation.club.userId) {
      await notifyUser({
        userId: negotiation.club.userId,
        type: 'application',
        title: `Parent ${decision === 'APPROVED' ? 'approved' : 'declined'} an offer`,
        message: `${playerName} — ${negotiation.club.name}`,
        link: '/dashboard/club/players',
      });
    }
  } catch {
    // La decisión ya está guardada; el aviso no debe deshacerla.
  }

  revalidatePaths(...APPROVAL_PATHS);
}

/** Decide una beca ofrecida a un hijo (solo el padre vinculado). */
export async function decideScholarshipApprovalAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const applicationId = str(formData, 'applicationId');
  if (!applicationId) return;
  const decision = formData.get('decision') === 'approve' ? 'APPROVED' : 'DECLINED';

  const parent = await prisma.parent.findUnique({ where: { userId: session.user.id } });
  if (!parent) return;

  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      parentApproval: 'PENDING',
      status: 'PENDING',
      player: { parents: { some: { parentId: parent.id } } },
      opportunity: { type: 'SCHOLARSHIP' },
    },
    include: {
      player: { select: { firstName: true, lastName: true, userId: true } },
      opportunity: {
        select: {
          title: true,
          scholarship: { select: { id: true } },
          university: { select: { userId: true, name: true } },
          school: { select: { userId: true, name: true } },
        },
      },
    },
  });
  if (!application) return;

  await prisma.application.update({
    where: { id: application.id },
    data: {
      status: decision === 'APPROVED' ? 'ACCEPTED' : 'REJECTED',
      parentApproval: decision,
      parentDecisionAt: new Date(),
      parentDecisionByUserId: session.user.id,
    },
  });

  const organisation =
    application.opportunity.university?.name ??
    application.opportunity.school?.name ??
    'The programme';
  const ownerUserId =
    application.opportunity.university?.userId ?? application.opportunity.school?.userId ?? null;
  const ownerLink = application.opportunity.university
    ? '/dashboard/university/scholarships'
    : '/dashboard/school/scholarships';
  const scholarshipId = application.opportunity.scholarship?.id;
  const detailPath = scholarshipId
    ? `${ownerLink}/${scholarshipId}`
    : null;
  const playerName = `${application.player.firstName} ${application.player.lastName}`.trim();

  try {
    await notifyUser({
      userId: application.player.userId,
      type: 'application',
      title: decision === 'APPROVED' ? 'Scholarship approved' : 'Scholarship declined',
      message:
        decision === 'APPROVED'
          ? `Your parent approved the ${application.opportunity.title} from ${organisation}.`
          : `Your parent declined the ${application.opportunity.title} from ${organisation}.`,
      link: '/dashboard/player/opportunities',
    });
    if (ownerUserId) {
      await notifyUser({
        userId: ownerUserId,
        type: 'application',
        title: `Parent ${decision === 'APPROVED' ? 'approved' : 'declined'} a scholarship`,
        message: `${playerName} — ${application.opportunity.title}`,
        link: ownerLink,
      });
    }
  } catch {
    // La decisión ya está guardada; el aviso no debe deshacerla.
  }

  revalidatePaths(
    ...APPROVAL_PATHS,
    ownerLink,
    ...(detailPath ? [detailPath] : [])
  );
}

