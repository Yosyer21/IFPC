import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { PageHeader } from '@/components/player/page-header';
import {
  HealthAgentProfileEditForm,
  type HealthAgentFormValues,
} from '@/components/health-agent/profile-edit-form';

export const metadata: Metadata = { title: 'Edit practice profile · Health agent' };

function toDateInput(value: Date | null): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

export default async function EditHealthAgentProfilePage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'HEALTH_AGENT') return null;

  const agent = await prisma.healthAgent.findUnique({ where: { userId: session.user.id } });

  const values: HealthAgentFormValues | null = agent
    ? {
        practiceName: agent.practiceName,
        headline: agent.headline,
        about: agent.about,
        specialties: agent.specialties as string[],
        services: agent.services,
        approach: agent.approach,
        registrationNumber: agent.registrationNumber,
        insuranceProvider: agent.insuranceProvider,
        insuranceExpiresAt: toDateInput(agent.insuranceExpiresAt),
        priceFrom: agent.priceFrom,
        currency: agent.currency,
        format: agent.format,
        sessionsOnline: agent.sessionsOnline,
        languages: agent.languages,
        city: agent.city,
        country: agent.country,
        website: agent.website,
        yearsExperience: agent.yearsExperience,
        clientsServed: agent.clientsServed,
        availabilityNote: agent.availabilityNote,
      }
    : null;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Practice profile"
        subtitle={'The details players and families see in The "1%" Factor before booking.'}
        icon="settings"
      />
      <p className="mb-6 text-sm">
        <Link
          href="/dashboard/health-agent/profile"
          className="text-[#4f6b0a] hover:underline"
        >
          ← Back to profile
        </Link>
      </p>
      <HealthAgentProfileEditForm agent={values} />
    </div>
  );
}
