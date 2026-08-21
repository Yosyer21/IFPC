import type { Metadata } from 'next';
import Link from 'next/link';
import { CreateRequirementForm } from '@/components/club/create-requirement-form';

export const metadata: Metadata = { title: 'Nuevo requisito' };

export default function ClubNewRequirementPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/club/requirements"
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Requisitos
      </Link>
      <h1 className="mb-6 text-2xl font-bold">Nuevo requisito</h1>
      <CreateRequirementForm />
    </div>
  );
}
