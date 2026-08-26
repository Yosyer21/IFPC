import type { Metadata } from 'next';
import { OnboardingForm, type OnboardingField } from '@/components/auth/onboarding-form';

export const metadata: Metadata = { title: 'Onboarding · Club' };

const FIELDS: OnboardingField[] = [
  { name: 'name', label: 'Nombre del club', required: true },
  { name: 'country', label: 'Country', required: true },
  { name: 'city', label: 'Ciudad' },
  { name: 'league', label: 'Liga' },
  { name: 'description', label: 'Description', type: 'textarea' },
];

export default function OnboardingClubPage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Profile del club</h1>
      <p className="mb-6 text-sm text-muted-foreground">Completa los datos del club.</p>
      <OnboardingForm role="club" fields={FIELDS} />
    </div>
  );
}
