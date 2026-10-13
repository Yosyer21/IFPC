import type { Metadata } from 'next';
import { OnboardingForm, type OnboardingField } from '@/components/auth/onboarding-form';

export const metadata: Metadata = { title: 'Onboarding · Agent' };

const FIELDS: OnboardingField[] = [
  { name: 'agency', label: 'Agency', placeholder: 'Agency name' },
  { name: 'license', label: 'Licence', placeholder: 'Licence number' },
];

export default function OnboardingAgentPage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Agent profile</h1>
      <p className="mb-6 text-sm text-muted-foreground">Complete your professional information.</p>
      <OnboardingForm role="agent" fields={FIELDS} />
    </div>
  );
}
