import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent } from '@future-buller/ui';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Contenido' };

const CATEGORIES = [
  {
    href: '/dashboard/admin/content/training',
    title: 'Entrenamiento',
    description: 'Catálogo de contenido técnico para jugadores',
  },
  {
    href: '/dashboard/admin/content/strength-conditioning',
    title: 'Fuerza y acondicionamiento',
    description: 'Rutinas de fuerza y prevención de lesiones',
  },
  {
    href: '/dashboard/admin/content/psychology',
    title: 'Psicología deportiva',
    description: 'Recursos de preparación mental',
  },
  {
    href: '/dashboard/admin/content/parent-education',
    title: 'Educación para familias',
    description: 'Guías para acompañar la carrera de los hijos',
  },
];

export default async function ContentPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Contenido"
        subtitle="Contenido de entrenamiento y educación publicado en la plataforma"
        icon="file"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CATEGORIES.map((category) => (
          <Link key={category.href} href={category.href} className="group block">
            <Card className="card-hover h-full">
              <CardContent>
                <h2 className="font-semibold">{category.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
                <span className="mt-3 inline-block text-sm text-primary group-hover:underline">
                  Gestionar →
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
