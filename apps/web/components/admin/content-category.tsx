import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { createTrainingContentAction, deleteTrainingContentAction } from '@/app/actions/admin';
import { PageHeader } from '@/components/player/page-header';

export async function ContentCategory({
  category,
  title,
  subtitle,
  icon,
}: {
  category: string;
  title: string;
  subtitle: string;
  icon: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const contents = await prisma.trainingContent.findMany({
    where: { category },
    orderBy: { createdAt: 'asc' },
  });

  const inputClass =
    'rounded-md border border-border bg-background px-3 py-2 text-sm';

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={title} subtitle={subtitle} icon={icon} />

      <Card className="animate-fade-up">
        <CardContent>
          <h2 className="mb-3 font-semibold">Publicar contenido</h2>
          <form action={createTrainingContentAction} className="flex flex-col gap-3">
            <input type="hidden" name="category" value={category} />
            <input
              required
              name="title"
              placeholder="Content title"
              className={inputClass}
            />
            <textarea
              name="description"
              placeholder="Description"
              rows={3}
              className={inputClass}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <input name="videoUrl" placeholder="Video URL" className={inputClass} />
              <input name="thumbnailUrl" placeholder="URL de imagen" className={inputClass} />
              <input
                type="number"
                min={1}
                max={300}
                name="durationMinutes"
                placeholder="Minutos"
                className={inputClass}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm text-muted-foreground">Dificultad (1-5)</label>
              <select
                name="difficulty"
                defaultValue="2"
                className="h-9 rounded-md border border-border bg-background px-2 text-sm"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-emerald-600"
              >
                Publicar
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Publicados ({contents.length})</h2>
      {contents.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">No content published in this category.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {contents.map((content) => (
            <Card key={content.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{content.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {content.durationMinutes ? `${content.durationMinutes} min` : '—'} · Dificultad{' '}
                    {content.difficulty ?? '—'}
                  </p>
                  {content.description ? (
                    <p className="mt-1 text-xs text-muted-foreground">{content.description}</p>
                  ) : null}
                </div>
                <form action={deleteTrainingContentAction}>
                  <input type="hidden" name="contentId" value={content.id} />
                  <button
                    type="submit"
                    className="rounded-md border border-destructive/40 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                  >
                    Eliminar
                  </button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
