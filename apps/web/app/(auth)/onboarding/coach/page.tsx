import type { Metadata } from 'next';
import { OnboardingForm, type OnboardingField } from '@/components/auth/onboarding-form';

export const metadata: Metadata = { title: 'Onboarding · Coach' };

const FIELDS: OnboardingField[] = [
  { name: 'clubName', label: 'Current club', placeholder: 'Club name' },
];

export default function OnboardingCoachPage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Coach profile</h1>
      <p className="mb-6 text-sm text-muted-foreground">Complete your information.</p>
      <OnboardingForm role="coach" fields={FIELDS} />
    </div>
  );
}
