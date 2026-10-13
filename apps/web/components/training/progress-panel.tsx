import { Badge, Card, CardContent } from '@ifpc/ui';
import type { TrainingProgressSummary } from '@/lib/training';

/** Pestaña «My progress»: lo completado, los exámenes y la actividad reciente. */
export function TrainingProgressPanel({ summary }: { summary: TrainingProgressSummary }) {
  const tiles = [
    {
      label: 'Courses completed',
      value: `${summary.courses.completed}/${summary.courses.total}`,
      hint: 'Mark a course as done or pass its quiz.',
    },
    {
      label: 'Exams passed',
      value: `${summary.courses.passed}`,
      hint: `${summary.quizzes.attempts} attempt${summary.quizzes.attempts === 1 ? '' : 's'} · best ${summary.quizzes.best}%`,
    },
    {
      label: 'Exercises completed',
      value: `${summary.exercises.completed}/${summary.exercises.total}`,
      hint: 'Exercises from the platform, your coach and your club.',
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {tiles.map((tile) => (
          <Card key={tile.label}>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">{tile.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{tile.label}</div>
              <p className="mt-2 text-xs text-muted-foreground">{tile.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-1">
          <h2 className="mb-2 font-semibold">Recent activity</h2>
          {summary.activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing yet. Complete an exercise or take a course quiz and it will show up here.
            </p>
          ) : (
            summary.activity.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 py-2 last:border-0"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{entry.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {entry.label === 'quiz' ? 'Course quiz' : 'Completed'} ·{' '}
                    {entry.date.toLocaleDateString('en-GB')}
                  </div>
                </div>
                {entry.label === 'quiz' ? (
                  <Badge variant={entry.passed ? 'success' : 'warning'}>
                    {entry.percent ?? 0}% {entry.passed ? '· Passed' : ''}
                  </Badge>
                ) : (
                  <Badge variant="success">Done</Badge>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
