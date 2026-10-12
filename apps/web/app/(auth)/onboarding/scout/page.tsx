import type { Metadata } from 'next';
import { OnboardingForm, type OnboardingField } from '@/components/auth/onboarding-form';

export const metadata: Metadata = { title: 'Onboarding · Scout' };

const FIELDS: OnboardingField[] = [
  { name: 'agency', label: 'Agency / Organisation', placeholder: 'Scouting network' },
];

export default function OnboardingScoutPage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Perfil de scout</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Discover talent, save players and scouting reports.
      </p>
      <OnboardingForm role="scout" fields={FIELDS} />
    </div>
  );
}
