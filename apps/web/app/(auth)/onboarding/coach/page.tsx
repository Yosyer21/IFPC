import type { Metadata } from 'next';
import { OnboardingForm, type OnboardingField } from '@/components/auth/onboarding-form';

export const metadata: Metadata = { title: 'Onboarding · Entrenador' };

const FIELDS: OnboardingField[] = [
  { name: 'clubName', label: 'Club actual', placeholder: 'Nombre del club' },
];

export default function OnboardingCoachPage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Perfil de entrenador</h1>
      <p className="mb-6 text-sm text-muted-foreground">Completa tu información.</p>
      <OnboardingForm role="coach" fields={FIELDS} />
    </div>
  );
}
