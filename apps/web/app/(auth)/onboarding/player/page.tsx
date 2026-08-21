import type { Metadata } from 'next';
import { OnboardingForm, type OnboardingField } from '@/components/auth/onboarding-form';

export const metadata: Metadata = { title: 'Onboarding · Jugador' };

const FIELDS: OnboardingField[] = [
  { name: 'firstName', label: 'Nombre', required: true },
  { name: 'lastName', label: 'Apellidos', required: true },
  { name: 'dateOfBirth', label: 'Fecha de nacimiento', type: 'date' },
  { name: 'nationality', label: 'Nacionalidad', placeholder: 'España' },
  { name: 'position', label: 'Posición', placeholder: 'DEL / MED / DEF…' },
  { name: 'foot', label: 'Pierna hábil', placeholder: 'Derecha / Izquierda' },
  { name: 'heightCm', label: 'Altura (cm)', type: 'number' },
  { name: 'weightKg', label: 'Peso (kg)', type: 'number' },
];

export default function OnboardingPlayerPage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Perfil de jugador</h1>
      <p className="mb-6 text-sm text-muted-foreground">Completa tu información deportiva.</p>
      <OnboardingForm role="player" fields={FIELDS} />
    </div>
  );
}
