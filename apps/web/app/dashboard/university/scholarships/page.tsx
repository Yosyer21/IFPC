import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { PageHeader } from '@/components/player/page-header';
import {
  ScholarshipsBoard,
  type ScholarshipRow,
} from '@/components/scholarships/scholarships-board';

export const metadata: Metadata = { title: 'Scholarships · University' };

export default async function UniversityScholarshipsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const university = await prisma.university.findUnique({ where: { userId: session.user.id } });
  if (!university) notFound();

  const scholarships = await prisma.scholarship.findMany({
    where: { universityId: university.id },
    include: {
      opportunity: {
        include: {
          _count: { select: { applications: true } },
          applications: { where: { status: 'ACCEPTED' }, select: { id: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const rows: ScholarshipRow[] = scholarships.map((scholarship) => ({
    id: scholarship.id,
    title: scholarship.opportunity.title,
    coverage: scholarship.coverage,
    spots: scholarship.spots,
    amount: scholarship.amount,
    intakeYear: scholarship.intakeYear,
    closesAt: scholarship.opportunity.closesAt,
    status: scholarship.opportunity.status,
    applications: scholarship.opportunity._count.applications,
    accepted: scholarship.opportunity.applications.length,
    position: scholarship.opportunity.position,
    location: scholarship.opportunity.location,
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Scholarships"
        subtitle="Programmes, spots and applicants for your university"
        icon="book"
      />
      <ScholarshipsBoard basePath="/dashboard/university/scholarships" rows={rows} />
    </div>
  );
}
