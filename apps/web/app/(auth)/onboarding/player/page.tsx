import type { Metadata } from 'next';
import { OnboardingForm, type OnboardingField } from '@/components/auth/onboarding-form';

export const metadata: Metadata = { title: 'Onboarding · Player' };

const FIELDS: OnboardingField[] = [
  { name: 'firstName', label: 'Name', required: true },
  { name: 'lastName', label: 'Surname', required: true },
  { name: 'dateOfBirth', label: 'Date of birth', type: 'date' },
  { name: 'nationality', label: 'Nationality', placeholder: 'Spain' },
  { name: 'position', label: 'Position', placeholder: 'DEL / MED / DEF…' },
  { name: 'foot', label: 'Preferred foot', placeholder: 'Right / Left' },
  { name: 'heightCm', label: 'Height (cm)', type: 'number' },
  { name: 'weightKg', label: 'Weight (kg)', type: 'number' },
];

export default function OnboardingPlayerPage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Player profile</h1>
      <p className="mb-6 text-sm text-muted-foreground">Complete your sports information.</p>
      <OnboardingForm role="player" fields={FIELDS} />
    </div>
  );
}
