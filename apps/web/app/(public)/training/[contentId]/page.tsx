import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@ifpc/database';
import { Badge } from '@ifpc/ui';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = { title: 'Ejercicio — IFPC' };

const CATEGORY_LABELS: Record<string, string> = {
  technical: 'Technique',
  'strength-conditioning': 'Strength and conditioning',
  psychology: 'Psychology',
  'parent-education': 'Para familias',
};

export default async function PublicTrainingDetailPage({
  params,
}: {
  params: Promise<{ contentId: string }>;
}) {
  const { contentId } = await params;

  const content = await prisma.trainingContent.findUnique({ where: { id: contentId } });
  if (!content) notFound();

  return (
    <div className="min-h-screen bg-[#0a0e0c] text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl px-4 py-16">
        <Link href="/training" className="text-sm text-muted-foreground hover:text-emerald-400">
          ← Entrenamiento
        </Link>

        <div className="mt-6 rounded-2xl border border-border/60 bg-card p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              {CATEGORY_LABELS[content.category] ?? content.category}
            </Badge>
            {content.durationMinutes ? (
              <span className="text-sm text-muted-foreground">{content.durationMinutes} min</span>
            ) : null}
            {content.difficulty ? (
              <span className="text-sm text-muted-foreground">Nivel {content.difficulty}/5</span>
            ) : null}
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight">{content.title}</h1>

          {content.videoUrl ? (
            <div className="mt-6 overflow-hidden rounded-xl border border-border/60">
              <video
                src={content.videoUrl}
                controls
                className="aspect-video w-full bg-black"
                poster={content.thumbnailUrl ?? undefined}
              />
            </div>
          ) : null}

          {content.description ? (
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              {content.description}
            </p>
          ) : null}

          <div className="mt-8 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center">
            <p className="text-sm text-muted-foreground">
              Want to follow this plan and receive exercises adapted to your level?
            </p>
            <Link
              href="/register"
              className="mt-4 inline-block rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-950 transition-colors hover:bg-emerald-400"
            >
              Crear cuenta de jugador
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}


