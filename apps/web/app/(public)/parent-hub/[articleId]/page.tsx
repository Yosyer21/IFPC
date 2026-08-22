import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@ifpc/database';
import { Badge } from '@ifpc/ui';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = { title: 'Guía — IFPC' };

export default async function PublicParentHubArticlePage({
  params,
}: {
  params: Promise<{ articleId: string }>;
}) {
  const { articleId } = await params;

  const article = await prisma.trainingContent.findUnique({ where: { id: articleId } });
  if (!article || article.category !== 'parent-education') notFound();

  return (
    <div className="min-h-screen bg-[#0a0e0c] text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl px-4 py-16">
        <Link href="/parent-hub" className="text-sm text-muted-foreground hover:text-emerald-400">
          ← Parent Hub
        </Link>

        <div className="mt-6 rounded-2xl border border-border/60 bg-card p-8">
          <Badge variant="outline">Guía para familias</Badge>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">{article.title}</h1>
          <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
            {article.durationMinutes ? (
              <span>{article.durationMinutes} min de lectura</span>
            ) : null}
            {article.difficulty ? <span>Nivel {article.difficulty}/5</span> : null}
            <span>{article.createdAt.toLocaleDateString('es')}</span>
          </div>

          {article.description ? (
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              {article.description}
            </p>
          ) : null}

          <div className="mt-8 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center">
            <p className="text-sm text-muted-foreground">
              Sigue todas las guías y el desarrollo de tu hijo desde tu cuenta familiar.
            </p>
            <Link
              href="/register"
              className="mt-4 inline-block rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-950 transition-colors hover:bg-emerald-400"
            >
              Crear cuenta familiar
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}


