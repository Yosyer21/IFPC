import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import {
  ScholarshipDetail,
  type ScholarshipApplicantRow,
} from '@/components/scholarships/scholarship-detail';
import { ageOn } from '@/lib/minor';

export const metadata: Metadata = { title: 'Scholarship · University' };

export default async function UniversityScholarshipDetailPage({
  params,
}: {
  params: Promise<{ scholarshipId: string }>;
}) {
  const { scholarshipId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const university = await prisma.university.findUnique({ where: { userId: session.user.id } });
  if (!university) notFound();

  const scholarship = await prisma.scholarship.findFirst({
    where: { id: scholarshipId, universityId: university.id },
    include: {
      opportunity: {
        include: {
          applications: {
            include: {
              player: {
                select: {
                  firstName: true,
                  lastName: true,
                  position: true,
                  dateOfBirth: true,
                  parents: { select: { parentId: true } },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  });
  if (!scholarship) notFound();

  const applicants: ScholarshipApplicantRow[] = scholarship.opportunity.applications.map(
    (application) => ({
      id: application.id,
      name: `${application.player.firstName} ${application.player.lastName}`.trim(),
      position: application.player.position,
      age: ageOn(application.player.dateOfBirth),
      status: application.status,
      parentApproval: application.parentApproval,
      appliedAt: application.createdAt,
      parentLinked: application.player.parents.length > 0,
    })
  );

  return (
    <ScholarshipDetail
      basePath="/dashboard/university/scholarships"
      scholarship={{
        id: scholarship.id,
        title: scholarship.opportunity.title,
        coverage: scholarship.coverage,
        spots: scholarship.spots,
        amount: scholarship.amount,
        minGpa: scholarship.minGpa,
        intakeYear: scholarship.intakeYear,
        closesAt: scholarship.opportunity.closesAt,
        status: scholarship.opportunity.status,
        description: scholarship.opportunity.description,
        position: scholarship.opportunity.position,
        ageMin: scholarship.opportunity.ageMin,
        ageMax: scholarship.opportunity.ageMax,
        location: scholarship.opportunity.location,
        applicants,
      }}
    />
  );
}
