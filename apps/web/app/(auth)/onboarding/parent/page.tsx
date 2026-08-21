import type { Metadata } from 'next';
import { OnboardingForm } from '@/components/auth/onboarding-form';

export const metadata: Metadata = { title: 'Onboarding · Familiar' };

export default function OnboardingParentPage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Cuenta de familiar</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Tu cuenta está lista. Podrás vincular a tus hijos/as desde el panel.
      </p>
      <OnboardingForm role="parent" fields={[]} />
    </div>
  );
}
