import Link from 'next/link';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { ScholarshipForm } from './scholarship-form';
import { toggleScholarshipStatusAction } from '@/app/actions/scholarships';
import { SCHOLARSHIP_COVERAGE_TONE, scholarshipCoverageLabel } from '@/lib/scholarships';

export interface ScholarshipRow {
  id: string;
  title: string;
  coverage: string;
  spots: number;
  amount: string | null;
  intakeYear: number | null;
  closesAt: Date | null;
  status: string;
  applications: number;
  accepted: number;
  position: string | null;
  location: string | null;
}

/**
 * Tablero de becas compartido por universidad y colegio: contadores, alta de
 * programa y tarjetas con plazas/postulantes. El detalle (y los postulantes)
 * vive en `basePath/[scholarshipId]`.
 */
export function ScholarshipsBoard({
  basePath,
  rows,
}: {
  basePath: string;
  rows: ScholarshipRow[];
}) {
  const open = rows.filter((row) => row.status === 'OPEN');
  const spots = open.reduce((total, row) => total + row.spots, 0);
  const applications = rows.reduce((total, row) => total + row.applications, 0);
  const awarded = rows.reduce((total, row) => total + row.accepted, 0);

  const kpis = [
    { label: 'Open programmes', value: open.length },
    { label: 'Open spots', value: spots },
    { label: 'Applicants', value: applications },
    { label: 'Awarded', value: awarded },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {kpi.label}
              </p>
              <p className="mt-1 text-2xl font-black tabular-nums">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div>
            <h2 className="font-semibold">New scholarship</h2>
            <p className="text-sm text-muted-foreground">
              Publish a programme with its own spots, coverage and deadline. It appears in the
              players&apos; Transfer Window as a scholarship opportunity.
            </p>
          </div>
          <ScholarshipForm />
        </CardContent>
      </Card>

      <section>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold tracking-tight">Programmes</h2>
          <span className="text-xs font-semibold text-muted-foreground">{rows.length}</span>
        </div>

        {rows.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                You haven&apos;t published a scholarship yet. Create the first programme above.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((row) => (
              <Card key={row.id} className="card-hover flex flex-col">
                <CardContent className="flex h-full flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`fb-tag ${SCHOLARSHIP_COVERAGE_TONE[row.coverage] ?? 'fb-tag-gray'}`}
                    >
                      {scholarshipCoverageLabel(row.coverage)}
                    </span>
                    <Badge variant={row.status === 'OPEN' ? 'success' : 'default'}>
                      {row.status === 'OPEN' ? 'Open' : 'Closed'}
                    </Badge>
                  </div>

                  <h3 className="text-base font-bold leading-snug">
                    <Link href={`${basePath}/${row.id}`} className="hover:underline">
                      {row.title}
                    </Link>
                  </h3>

                  <p className="text-xs text-muted-foreground">
                    {[
                      `${row.spots} spot${row.spots === 1 ? '' : 's'}`,
                      row.amount,
                      row.intakeYear ? `Intake ${row.intakeYear}` : null,
                      row.position,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {row.applications} applicant{row.applications === 1 ? '' : 's'} ·{' '}
                    {row.accepted} awarded
                    {row.closesAt
                      ? ` · closes ${row.closesAt.toLocaleDateString('en-GB')}`
                      : ''}
                  </p>

                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
                    <Link
                      href={`${basePath}/${row.id}`}
                      className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-muted"
                    >
                      Applicants
                    </Link>
                    <form action={toggleScholarshipStatusAction}>
                      <input type="hidden" name="scholarshipId" value={row.id} />
                      <button
                        type="submit"
                        className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted"
                      >
                        {row.status === 'OPEN' ? 'Close programme' : 'Reopen programme'}
                      </button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
