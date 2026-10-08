import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { getAuthorAnalytics } from '@/lib/discovery-analytics';

export const metadata: Metadata = { title: 'Rendimiento en Discovery' };

/** Una cifra del panel, con su etiqueta. */
function Metric({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <Card>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{label}</div>
        {hint ? <div className="text-xs text-muted-foreground/70">{hint}</div> : null}
      </CardContent>
    </Card>
  );
}

/** Rendimiento de las publicaciones del perfil: alcance, engagement y etiquetas. */
export default async function DiscoveryAnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const analytics = await getAuthorAnalytics(session.user.id);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Rendimiento en Discovery"
        subtitle={
          analytics.posts > 0
            ? `Tus ${analytics.posts} publicaciones en ${analytics.reach + analytics.anonymousOpenings} aperturas`
            : 'Todavía no has publicado nada'
        }
        icon="trending"
      >
        <Link
          href="/dashboard/discovery"
          className="text-sm text-muted-foreground hover:underline"
        >
          Volver al feed →
        </Link>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric label="Publicaciones" value={analytics.posts} />
        <Metric
          label="Personas alcanzadas"
          value={analytics.reach}
          hint="Perfiles identificables que abrieron tus publicaciones"
        />
        <Metric
          label="Aperturas anónimas"
          value={analytics.anonymousOpenings}
          hint="Desde el Discovery público"
        />
        <Metric label="Engagement" value={analytics.engagement} hint="Me gusta ×3 + comentarios ×2 + alcance" />
        <Metric label="Me gusta" value={analytics.likes} />
        <Metric label="Comentarios" value={analytics.comments} />
      </div>

      {analytics.bestHour !== null ? (
        <Card className="mt-4">
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Tu mejor hora para publicar es alrededor de las{' '}
              <strong className="text-foreground">
                {String(analytics.bestHour).padStart(2, '0')}:00
              </strong>{' '}
              (hora del servidor), según el engagement medio de lo que ya has publicado.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold">Tus publicaciones con más interacción</h2>
            {analytics.topPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos todavía.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {analytics.topPosts.map((post) => (
                  <li key={post.id} className="flex items-center justify-between gap-3 text-sm">
                    <Link
                      href={`/dashboard/discovery/${post.id}`}
                      className="truncate text-muted-foreground hover:text-foreground"
                    >
                      {post.label}
                    </Link>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {post.score}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold">Etiquetas que más usas</h2>
            {analytics.topTags.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin etiquetas todavía.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {analytics.topTags.map((tag) => (
                  <Link
                    key={tag.tag}
                    href={`/dashboard/discovery/tag/${tag.tag}`}
                    className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                  >
                    #{tag.tag} · {tag.posts}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
