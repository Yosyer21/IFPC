'use server';

import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { scholarshipSchema } from '@ifpc/validation';
import { needsParentApproval } from '@/lib/minor';
import { notifyUser } from '@/lib/notifications/notify';
import { revalidatePaths } from '@/lib/revalidate';
import type { ActionState } from './auth';

interface Owner {
  kind: 'UNIVERSITY' | 'SCHOOL';
  universityId: string | null;
  schoolId: string | null;
  name: string;
  city: string | null;
  country: string;
}

/** Universidad o colegio del usuario (los únicos que publican becas). */
async function getOwner(): Promise<Owner | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const university = await prisma.university.findUnique({
    where: { userId: session.user.id },
    select: { id: true, name: true, city: true, country: true },
  });
  if (university) {
    return {
      kind: 'UNIVERSITY',
      universityId: university.id,
      schoolId: null,
      name: university.name,
      city: university.city,
      country: university.country,
    };
  }

  const school = await prisma.school.findUnique({
    where: { userId: session.user.id },
    select: { id: true, name: true, city: true, country: true },
  });
  if (school) {
    return {
      kind: 'SCHOOL',
      universityId: null,
      schoolId: school.id,
      name: school.name,
      city: school.city,
      country: school.country,
    };
  }

  return null;
}

const str = (formData: FormData, key: string): string | null => {
  const value = formData.get(key);
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

function revalidateScholarships(owner: Owner, scholarshipId?: string): void {
  const area = owner.kind === 'UNIVERSITY' ? 'university' : 'school';
  revalidatePaths(
    `/dashboard/${area}/scholarships`,
    `/dashboard/${area}`,
    '/dashboard/player/opportunities',
    '/opportunities',
    ...(scholarshipId ? [`/dashboard/${area}/scholarships/${scholarshipId}`] : [])
  );
}

/**
 * Crea una beca/programa: la `Opportunity` (tipo SCHOLARSHIP) para el flujo de
 * postulaciones + la fila `Scholarship` con plazas, cobertura y requisitos.
 */
export async function createScholarshipAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const owner = await getOwner();
  if (!owner) {
    return { error: 'Only universities and schools can publish scholarships.' };
  }

  const parsed = scholarshipSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: 'Check the scholarship details.' };
  }
  const input = parsed.data;

  let closesAt: Date | null = null;
  if (input.closesAt) {
    closesAt = new Date(`${input.closesAt}T23:59:59.000Z`);
    if (Number.isNaN(closesAt.getTime())) {
      return { error: 'Invalid closing date.' };
    }
  }

  try {
    await prisma.opportunity.create({
      data: {
        creatorType: owner.kind,
        universityId: owner.universityId,
        schoolId: owner.schoolId,
        title: input.title,
        type: 'SCHOLARSHIP',
        status: 'OPEN',
        position: input.position || null,
        ageMin: input.ageMin,
        ageMax: input.ageMax,
        location: owner.city ?? owner.country,
        description: input.description || null,
        closesAt,
        scholarship: {
          create: {
            universityId: owner.universityId,
            schoolId: owner.schoolId,
            coverage: input.coverage,
            spots: input.spots,
            amount: input.amount || null,
            minGpa: input.minGpa,
            intakeYear: input.intakeYear,
          },
        },
      },
    });
  } catch {
    return { error: 'The scholarship could not be published.' };
  }

  revalidateScholarships(owner);
  return { success: 'Scholarship published.' };
}

/** Abre o cierra el programa (la oportunidad asociada). */
export async function toggleScholarshipStatusAction(formData: FormData): Promise<void> {
  const owner = await getOwner();
  if (!owner) return;
  const scholarshipId = str(formData, 'scholarshipId');
  if (!scholarshipId) return;

  const scholarship = await prisma.scholarship.findFirst({
    where: {
      id: scholarshipId,
      ...(owner.kind === 'UNIVERSITY'
        ? { universityId: owner.universityId }
        : { schoolId: owner.schoolId }),
    },
    select: { id: true, opportunity: { select: { id: true, status: true } } },
  });
  if (!scholarship) return;

  await prisma.opportunity.update({
    where: { id: scholarship.opportunity.id },
    data: { status: scholarship.opportunity.status === 'OPEN' ? 'CLOSED' : 'OPEN' },
  });

  revalidateScholarships(owner, scholarship.id);
}

/**
 * La universidad/colegio decide sobre una postulación: ofrecer la beca o
 * rechazarla. Si el jugador es menor de 16 con padre, la oferta queda
 * `PENDING` hasta que la familia la apruebe.
 */
export async function decideScholarshipApplicationAction(formData: FormData): Promise<void> {
  const owner = await getOwner();
  if (!owner) return;

  const applicationId = str(formData, 'applicationId');
  if (!applicationId) return;
  const decision = formData.get('decision') === 'offer' ? 'OFFER' : 'DECLINE';

  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      opportunity: {
        type: 'SCHOLARSHIP',
        ...(owner.kind === 'UNIVERSITY'
          ? { universityId: owner.universityId }
          : { schoolId: owner.schoolId }),
      },
    },
    include: {
      player: {
        select: {
          firstName: true,
          lastName: true,
          userId: true,
          dateOfBirth: true,
          parents: { select: { parent: { select: { userId: true } } } },
        },
      },
      opportunity: {
        select: {
          id: true,
          title: true,
          scholarship: { select: { id: true } },
          university: { select: { name: true } },
          school: { select: { name: true } },
        },
      },
    },
  });
  if (!application) return;

  const playerName = `${application.player.firstName} ${application.player.lastName}`.trim();
  const organisation =
    application.opportunity.university?.name ?? application.opportunity.school?.name ?? owner.name;

  if (decision === 'DECLINE') {
    await prisma.application.update({
      where: { id: application.id },
      data: { status: 'REJECTED' },
    });
    try {
      await notifyUser({
        userId: application.player.userId,
        type: 'application',
        title: 'Scholarship application declined',
        message: `${organisation} declined the ${application.opportunity.title} application.`,
        link: '/dashboard/player/opportunities',
      });
    } catch {
      // La decisión ya está guardada.
    }
  } else {
    const requiresParent = needsParentApproval(
      application.player.dateOfBirth,
      application.player.parents
    );

    await prisma.application.update({
      where: { id: application.id },
      data: requiresParent
        ? { status: 'PENDING', parentApproval: 'PENDING' }
        : { status: 'ACCEPTED', parentApproval: 'NOT_REQUIRED' },
    });

    try {
      if (requiresParent) {
        await notifyUser({
          userId: application.player.userId,
          type: 'application',
          title: 'Scholarship offer — waiting for your parent',
          message: `${organisation} wants to offer you the ${application.opportunity.title}. Your parent needs to approve it.`,
          link: '/dashboard/player/opportunities',
        });
        for (const link of application.player.parents) {
          await notifyUser({
            userId: link.parent.userId,
            type: 'application',
            title: 'Scholarship offer to approve',
            message: `${organisation} wants to offer ${playerName} the ${application.opportunity.title}.`,
            link: '/dashboard/parent/approvals',
          });
        }
      } else {
        await notifyUser({
          userId: application.player.userId,
          type: 'application',
          title: 'Scholarship offered',
          message: `${organisation} offered you the ${application.opportunity.title}.`,
          link: '/dashboard/player/opportunities',
        });
      }
    } catch {
      // La decisión ya está guardada.
    }
  }

  revalidateScholarships(owner, application.opportunity.scholarship?.id);
  revalidatePaths('/dashboard/parent/approvals');
}
