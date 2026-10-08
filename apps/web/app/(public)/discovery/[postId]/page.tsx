import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { POST_TYPE_LABELS } from '@ifpc/config';
import { Card, CardContent } from '@ifpc/ui';
import { CommentList } from '@/components/discovery/comment-list';
import { PostCard } from '@/components/discovery/post-card';
import { Footer } from '@/components/landing/footer';
import { Navbar } from '@/components/landing/navbar';
import { getPostForViewer, listComments } from '@/lib/discovery';

const BASE = '/discovery';

/** SEO: título y descripción a partir de la publicación. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ postId: string }>;
}): Promise<Metadata> {
  const { postId } = await params;
  const post = await getPostForViewer(postId);
  if (!post) {
    return { title: 'Publicación no encontrada — Future Baller' };
  }

  const title = post.title ?? `${POST_TYPE_LABELS[post.type] ?? 'Publicación'} de ${post.author.name}`;
  const description =
    (post.body ?? '').slice(0, 150) ||
    `Publicación de ${post.author.name} en Discovery (Future Baller).`;

  return {
    title: `${title} — Future Baller`,
    description,
    alternates: { canonical: `${BASE}/${postId}` },
    openGraph: { title, description, type: 'article' },
  };
}

/** Detalle público de una publicación: lectura de la publicación y sus comentarios. */
export default async function PublicPostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const post = await getPostForViewer(postId);
  if (!post) notFound();

  const comments = await listComments(postId);
  // Sin sesión no se cuentan vistas: el alcance solo suma espectadores identificables.

  return (
    <div className="min-h-screen bg-[#0a0e0c] text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl px-4 py-24">
        <Link href={BASE} className="text-sm text-muted-foreground hover:text-foreground">
          ← Volver a Discovery
        </Link>

        <div className="mt-4">
          <PostCard post={post} viewerId="" viewerRole="" readOnly />
        </div>

        <Card className="mt-4">
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Entra para comentar, dar me gusta y seguir a este perfil.
            </p>
            <Link
              href="/login"
              className="rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-lime-400 px-4 py-2 text-sm font-semibold text-emerald-950"
            >
              Entrar
            </Link>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardContent className="flex flex-col gap-4">
            <h2 className="font-semibold">Comentarios ({comments.length})</h2>
            <CommentList
              comments={comments}
              postId={post.id}
              viewerId=""
              viewerRole=""
              postAuthorId={post.author.id}
              readOnly
              base={BASE}
            />
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
