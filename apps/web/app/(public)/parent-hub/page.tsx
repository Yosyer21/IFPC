import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@ifpc/database';
import { Badge } from '@ifpc/ui';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'Parent Hub — IFPC',
  description: 'Guides and resources to support your child\u2019s football career.',
};

export default async function PublicParentHubPage() {
  const articles = await prisma.trainingContent.findMany({
    where: { category: 'parent-education' },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="min-h-screen bg-[#0a0e0c] text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-4 py-16">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
            Parent Hub
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            Guides for families
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {articles.length} guides to support your child's career: development, academies,
            scholarships, contracts and sports psychology.
          </p>
        </div>

        {articles.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-card p-10 text-center">
            <p className="text-muted-foreground">No guides published yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/parent-hub/${article.id}`}
                className="group rounded-2xl border border-border/60 bg-card p-6 transition-all hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10"
              >
                <Badge variant="outline">Guide for families</Badge>
                <h2 className="mt-4 font-semibold group-hover:text-emerald-400">
                  {article.title}
                </h2>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                  {article.description}
                </p>
                <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                  {article.durationMinutes ? (
                    <span>{article.durationMinutes} min de lectura</span>
                  ) : null}
                  <span>{article.createdAt.toLocaleDateString('es')}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}


