import Link from 'next/link';

const ROLES = [
  { href: '/onboarding/player', label: 'Player', description: 'Profile deportivo' },
  { href: '/onboarding/parent', label: 'Familiar', description: 'Cuenta de padre/madre/tutor' },
  { href: '/onboarding/coach', label: 'Coach', description: 'Datos de coach' },
  { href: '/onboarding/scout', label: 'Scout', description: 'Agencia y cobertura' },
  { href: '/onboarding/agent', label: 'Agente', description: 'Agencia y licencia' },
  { href: '/onboarding/club', label: 'Club', description: 'Datos del club' },
  { href: '/onboarding/university', label: 'University', description: 'Academic-sports institution' },
  {
    href: '/onboarding/school',
    label: 'School / Community service',
    description: 'Colegios, clubs escolares y programas comunitarios',
  },
];

export default function OnboardingPage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Complete your profile</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Choose your account type to continue with sign-up.
      </p>
      <div className="flex flex-col gap-2">
        {ROLES.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md border border-border p-3 transition-colors hover:bg-muted"
          >
            <span className="font-medium">{item.label}</span>
            <span className="text-sm text-muted-foreground"> · {item.description}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
