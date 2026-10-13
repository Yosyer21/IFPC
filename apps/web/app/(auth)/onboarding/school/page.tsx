import type { Metadata } from 'next';
import { OnboardingForm, type OnboardingField } from '@/components/auth/onboarding-form';

export const metadata: Metadata = { title: 'Onboarding · School / Community' };

const FIELDS: OnboardingField[] = [
  { name: 'name', label: 'School / service name', required: true },
  {
    name: 'type',
    label: 'Organisation type',
    type: 'select',
    options: [
      { value: 'SCHOOL', label: 'School / College' },
      { value: 'COMMUNITY_SERVICE', label: 'Community service' },
    ],
  },
  { name: 'country', label: 'Country', required: true },
  { name: 'city', label: 'City' },
  { name: 'contactName', label: 'Contact person' },
  { name: 'website', label: 'Website', placeholder: 'https://' },
  { name: 'description', label: 'Description', type: 'textarea' },
];

export default function OnboardingSchoolPage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">School / community service profile</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Schools, school clubs and community services bringing football to girls: programmes,
        groups and inclusive clinics.
      </p>
      <OnboardingForm role="school" fields={FIELDS} />
    </div>
  );
}
