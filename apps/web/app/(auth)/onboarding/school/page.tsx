import type { Metadata } from 'next';
import { OnboardingForm, type OnboardingField } from '@/components/auth/onboarding-form';

export const metadata: Metadata = { title: 'Onboarding · Escuela / Comunidad' };

const FIELDS: OnboardingField[] = [
  { name: 'name', label: 'Nombre de la escuela / servicio', required: true },
  {
    name: 'type',
    label: 'Tipo de organización',
    type: 'select',
    options: [
      { value: 'SCHOOL', label: 'Escuela / Colegio' },
      { value: 'COMMUNITY_SERVICE', label: 'Servicio comunitario' },
    ],
  },
  { name: 'country', label: 'Country', required: true },
  { name: 'city', label: 'Ciudad' },
  { name: 'contactName', label: 'Persona de contacto' },
  { name: 'website', label: 'Website', placeholder: 'https://' },
  { name: 'description', label: 'Description', type: 'textarea' },
];

export default function OnboardingSchoolPage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Perfil de escuela / servicio comunitario</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Colegios, clubes escolares y servicios comunitarios que acercan el fútbol a las niñas:
        programas, grupos y clínicas inclusivas.
      </p>
      <OnboardingForm role="school" fields={FIELDS} />
    </div>
  );
}
