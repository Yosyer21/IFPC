import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@ifpc/database';
import { Badge } from '@ifpc/ui';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'Entrenamiento — IFPC',
  description: 'Ejercicios, rutinas y contenido de desarrollo futbolístico abierto.',
};

const CATEGORY_LABELS: Record<string, string> = {
  technical: 'Técnica',
  'strength-conditioning': 'Fuerza y condición',
  psychology: 'Psicología',
};

export default async function PublicTrainingPage() {
  const content = await prisma.trainingContent.findMany({
    where: { category: { in: ['technical', 'strength-conditioning', 'psychology'] } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const categories = new Set(content.map((item) => item.category));

  return (
    <div className="min-h-screen bg-[#0a0e0c] text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Training</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Plan de entrenamiento abierto</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {content.length} ejercicios · {categories.size} áreas. Accede al catálogo completo y a tu
            plan personalizado con una cuenta de jugador.
          </p>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <Badge key={key} variant="outline">
              {label} · {content.filter((item) => item.category === key).length}
            </Badge>
          ))}
        </div>

        {content.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-card p-10 text-center">
            <p className="text-muted-foreground">Aún no hay contenido publicado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {content.map((item) => (
              <Link
                key={item.id}
                href={`/training/${item.id}`}
                className="group rounded-2xl border border-border/60 bg-card p-6 transition-all hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline">
                    {CATEGORY_LABELS[item.category] ?? item.category}
                  </Badge>
                  {item.durationMinutes ? (
                    <span className="text-xs text-muted-foreground">
                      {item.durationMinutes} min
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-4 font-semibold group-hover:text-emerald-400">{item.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                  {item.description}
                </p>
                {item.difficulty ? (
                  <div className="mt-4 text-xs text-muted-foreground">
                    Nivel {'★'.repeat(item.difficulty)}
                    <span className="opacity-40">{'★'.repeat(Math.max(0, 5 - item.difficulty))}</span>
                  </div>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}


