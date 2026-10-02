import type { Metadata } from 'next';
import { OnboardingForm, type OnboardingField } from '@/components/auth/onboarding-form';

export const metadata: Metadata = { title: 'Onboarding · Ojeador' };

const FIELDS: OnboardingField[] = [
  { name: 'agency', label: 'Agencia / Organización', placeholder: 'Scouting network' },
];

export default function OnboardingScoutPage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Perfil de ojeador</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Descubre talento, guarda jugadores e informes de scouting.
      </p>
      <OnboardingForm role="scout" fields={FIELDS} />
    </div>
  );
}
