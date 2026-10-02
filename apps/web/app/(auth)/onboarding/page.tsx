import Link from 'next/link';

const ROLES = [
  { href: '/onboarding/player', label: 'Jugador/a', description: 'Profile deportivo' },
  { href: '/onboarding/parent', label: 'Familiar', description: 'Cuenta de padre/madre/tutor' },
  { href: '/onboarding/coach', label: 'Entrenador/a', description: 'Datos de entrenador' },
  { href: '/onboarding/scout', label: 'Ojeador/a', description: 'Agencia y cobertura' },
  { href: '/onboarding/agent', label: 'Agente', description: 'Agencia y licencia' },
  { href: '/onboarding/club', label: 'Club', description: 'Datos del club' },
  { href: '/onboarding/university', label: 'Universidad', description: 'Institución académico-deportiva' },
  {
    href: '/onboarding/school',
    label: 'Escuela / Servicio comunitario',
    description: 'Colegios, clubes escolares y programas comunitarios',
  },
];

export default function OnboardingPage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Completa tu perfil</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Elige tu tipo de cuenta para continuar con el registro.
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
