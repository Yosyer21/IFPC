import type { Metadata } from 'next';
import { OnboardingForm, type OnboardingField } from '@/components/auth/onboarding-form';

export const metadata: Metadata = { title: 'Onboarding · University' };

const FIELDS: OnboardingField[] = [
  { name: 'name', label: 'University name', required: true },
  { name: 'country', label: 'Country', required: true },
  { name: 'city', label: 'City' },
  { name: 'description', label: 'Description', type: 'textarea' },
];

export default function OnboardingUniversityPage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">University profile</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Academic-sports institution: recruitment and scholarships.
      </p>
      <OnboardingForm role="university" fields={FIELDS} />
    </div>
  );
}
