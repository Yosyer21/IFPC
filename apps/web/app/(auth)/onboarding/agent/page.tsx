import type { Metadata } from 'next';
import { OnboardingForm, type OnboardingField } from '@/components/auth/onboarding-form';

export const metadata: Metadata = { title: 'Onboarding · Agente' };

const FIELDS: OnboardingField[] = [
  { name: 'agency', label: 'Agencia', placeholder: 'Nombre de la agencia' },
  { name: 'license', label: 'Licencia', placeholder: 'Nº de licencia' },
];

export default function OnboardingAgentPage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Profile de agente</h1>
      <p className="mb-6 text-sm text-muted-foreground">Complete your professional information.</p>
      <OnboardingForm role="agent" fields={FIELDS} />
    </div>
  );
}
