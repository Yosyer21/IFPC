import type { Metadata } from 'next';
import { OnboardingForm, type OnboardingField } from '@/components/auth/onboarding-form';

export const metadata: Metadata = { title: 'Onboarding · Universidad' };

const FIELDS: OnboardingField[] = [
  { name: 'name', label: 'Nombre de la universidad', required: true },
  { name: 'country', label: 'Country', required: true },
  { name: 'city', label: 'Ciudad' },
  { name: 'description', label: 'Description', type: 'textarea' },
];

export default function OnboardingUniversityPage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Perfil de universidad</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Institución académico-deportiva: reclutamiento y becas.
      </p>
      <OnboardingForm role="university" fields={FIELDS} />
    </div>
  );
}
