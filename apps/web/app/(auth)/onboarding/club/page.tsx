import type { Metadata } from 'next';
import { OnboardingForm, type OnboardingField } from '@/components/auth/onboarding-form';

export const metadata: Metadata = { title: 'Onboarding · Club' };

const FIELDS: OnboardingField[] = [
  { name: 'name', label: 'Nombre del club', required: true },
  { name: 'country', label: 'País', required: true },
  { name: 'city', label: 'Ciudad' },
  { name: 'league', label: 'Liga' },
  { name: 'description', label: 'Descripción', type: 'textarea' },
];

export default function OnboardingClubPage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Perfil del club</h1>
      <p className="mb-6 text-sm text-muted-foreground">Completa los datos del club.</p>
      <OnboardingForm role="club" fields={FIELDS} />
    </div>
  );
}
