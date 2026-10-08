import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { POST_TYPE_LABELS, ROLE_LABELS } from '@ifpc/config';
import { Badge, Card, CardContent } from '@ifpc/ui';
import {
  deletePostAction,
  moderatePostAction,
  pinPostAction,
  resolveReportsAction,
} from '@/app/actions/discovery';
import { ActionSubmit } from '@/components/discovery/action-submit';
import { PageHeader } from '@/components/player/page-header';
import { formatRelativeTime } from '@/lib/discovery';
import { listModerationLog, listReportedPosts } from '@/lib/discovery-moderation';
import { MODERATION_ACTION_LABELS } from '@/lib/labels';

export const metadata: Metadata = { title: 'Discovery — Moderación' };

/** Panel de moderación del feed: denuncias pendientes y traza de acciones. */
export default async function AdminDiscoveryPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (session.user.role !== 'ADMIN') notFound();

  const [reported, log] = await Promise.all([listReportedPosts(), listModerationLog()]);
  const pendingReports = reported.reduce((sum, entry) => sum + entry.reports.length, 0);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Moderación de Discovery"
        subtitle={
          reported.length === 0
            ? 'Sin denuncias pendientes'
            : `${pendingReports} denuncias pendientes en ${reported.length} publicaciones`
        }
        icon="shield"
      >
        <Link href="/dashboard/discovery" className="text-sm text-muted-foreground hover:underline">
          Ver el feed →
        </Link>
      </PageHeader>

      {reported.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No hay publicaciones denunciadas. Las denuncias que atiendas desaparecen de esta cola.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {reported.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="danger">
                    {entry.reports.length} {entry.reports.length === 1 ? 'denuncia' : 'denuncias'}
                  </Badge>
                  <Badge variant="outline">{POST_TYPE_LABELS[entry.type] ?? entry.type}</Badge>
                  {entry.pinned ? <Badge variant="success">Fijado</Badge> : null}
                  {entry.status === 'HIDDEN' ? <Badge variant="warning">Oculta</Badge> : null}
                  <span className="text-xs text-muted-foreground">
                    {entry.author.name} · {ROLE_LABELS[entry.author.role] ?? entry.author.role} ·{' '}
                    {formatRelativeTime(entry.createdAt)}
                  </span>
                </div>

                {entry.title ? <h2 className="font-semibold">{entry.title}</h2> : null}
                {entry.body ? (
                  <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                    {entry.body}
                  </p>
                ) : null}

                <ul className="flex flex-col gap-1 border-l border-white/10 pl-3">
                  {entry.reports.map((report) => (
                    <li key={report.id} className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{report.reporter.name}</span>:{' '}
                      {report.reason}
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/dashboard/discovery/${entry.id}`}
                    className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                  >
                    Ver publicación
                  </Link>

                  <form action={moderatePostAction}>
                    <input type="hidden" name="postId" value={entry.id} />
                    <input
                      type="hidden"
                      name="status"
                      value={entry.status === 'HIDDEN' ? 'PUBLISHED' : 'HIDDEN'}
                    />
                    <ActionSubmit
                      label={entry.status === 'HIDDEN' ? 'Volver a publicar' : 'Ocultar'}
                      variant="primary"
                    />
                  </form>

                  <form action={pinPostAction}>
                    <input type="hidden" name="postId" value={entry.id} />
                    <ActionSubmit label={entry.pinned ? 'Desfijar' : 'Fijar'} />
                  </form>

                  <form action={resolveReportsAction}>
                    <input type="hidden" name="postId" value={entry.id} />
                    <ActionSubmit label="Atender denuncias" />
                  </form>

                  <form action={deletePostAction}>
                    <input type="hidden" name="postId" value={entry.id} />
                    <input type="hidden" name="redirectTo" value="/dashboard/admin/discovery" />
                    <ActionSubmit
                      label="Borrar"
                      variant="danger"
                      confirmText="¿Borrar la publicación definitivamente?"
                    />
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="mt-6">
        <CardContent className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">Actividad de moderación</h2>
          {log.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no hay acciones registradas.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {log.map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="outline">
                    {MODERATION_ACTION_LABELS[entry.action] ?? entry.action}
                  </Badge>
                  <Link
                    href={`/dashboard/discovery/${entry.postId}`}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {entry.postId}
                  </Link>
                  <span className="text-muted-foreground">
                    por {entry.actor.name} · {formatRelativeTime(entry.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
