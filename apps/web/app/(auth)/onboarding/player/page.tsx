import type { Metadata } from 'next';
import { OnboardingForm, type OnboardingField } from '@/components/auth/onboarding-form';

export const metadata: Metadata = { title: 'Onboarding · Jugador' };

const FIELDS: OnboardingField[] = [
  { name: 'firstName', label: 'Nombre', required: true },
  { name: 'lastName', label: 'Apellidos', required: true },
  { name: 'dateOfBirth', label: 'Fecha de nacimiento', type: 'date' },
  { name: 'nationality', label: 'Nacionalidad', placeholder: 'Spain' },
  { name: 'position', label: 'Position', placeholder: 'DEL / MED / DEF…' },
  { name: 'foot', label: 'Preferred foot', placeholder: 'Derecha / Izquierda' },
  { name: 'heightCm', label: 'Altura (cm)', type: 'number' },
  { name: 'weightKg', label: 'Peso (kg)', type: 'number' },
];

export default function OnboardingPlayerPage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Profile de jugador</h1>
      <p className="mb-6 text-sm text-muted-foreground">Complete your sports information.</p>
      <OnboardingForm role="player" fields={FIELDS} />
    </div>
  );
}
