import type { Metadata } from 'next';
import Link from 'next/link';
import { CreateRequirementForm } from '@/components/club/create-requirement-form';

export const metadata: Metadata = { title: 'New requirement' };

export default function ClubNewRequirementPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/club/requirements"
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Requirements
      </Link>
      <h1 className="mb-6 text-2xl font-bold">New requirement</h1>
      <CreateRequirementForm />
    </div>
  );
}
