import type { Metadata } from 'next';
import Link from 'next/link';
import { InviteStaffForm } from '@/components/club/invite-staff-form';

export const metadata: Metadata = { title: 'Invitar miembro' };

export default function ClubInviteStaffPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/club/staff"
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Miembros
      </Link>
      <h1 className="mb-6 text-2xl font-bold">Invitar miembro</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        El miembro debe tener una cuenta registrada en la plataforma.
      </p>
      <InviteStaffForm />
    </div>
  );
}
