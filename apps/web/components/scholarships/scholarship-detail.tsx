import Link from 'next/link';
import { Badge, Card, CardContent } from '@ifpc/ui';
import {
  decideScholarshipApplicationAction,
  toggleScholarshipStatusAction,
} from '@/app/actions/scholarships';
import {
  SCHOLARSHIP_COVERAGE_TONE,
  scholarshipCoverageLabel,
  scholarshipSummary,
} from '@/lib/scholarships';

export interface ScholarshipApplicantRow {
  id: string;
  name: string;
  position: string | null;
  age: number | null;
  status: string;
  parentApproval: string;
  appliedAt: Date;
  parentLinked: boolean;
}

export interface ScholarshipDetailData {
  id: string;
  title: string;
  coverage: string;
  spots: number;
  amount: string | null;
  minGpa: number | null;
  intakeYear: number | null;
  closesAt: Date | null;
  status: string;
  description: string | null;
  position: string | null;
  ageMin: number | null;
  ageMax: number | null;
  location: string | null;
  applicants: ScholarshipApplicantRow[];
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'default'> = {
  ACCEPTED: 'success',
  PENDING: 'warning',
};

/** Detalle de un programa de beca + sus postulantes (universidad o colegio). */
export function ScholarshipDetail({
  basePath,
  scholarship,
}: {
  basePath: string;
  scholarship: ScholarshipDetailData;
}) {
  const details: [string, string][] = [
    ['Coverage', scholarshipCoverageLabel(scholarship.coverage)],
    ['Spots', String(scholarship.spots)],
    ['Funding', scholarship.amount ?? '—'],
    ['Minimum GPA', scholarship.minGpa !== null ? scholarship.minGpa.toFixed(1) : '—'],
    ['Intake', scholarship.intakeYear ? String(scholarship.intakeYear) : '—'],
    [
      'Deadline',
      scholarship.closesAt ? scholarship.closesAt.toLocaleDateString('en-GB') : 'No deadline',
    ],
    ['Position', scholarship.position ?? 'All positions'],
    [
      'Age range',
      scholarship.ageMin || scholarship.ageMax
        ? `${scholarship.ageMin ?? '?'}–${scholarship.ageMax ?? '?'} years old`
        : 'Any age',
    ],
    ['Location', scholarship.location ?? '—'],
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={basePath}
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Scholarships
      </Link>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`fb-tag ${
                SCHOLARSHIP_COVERAGE_TONE[scholarship.coverage] ?? 'fb-tag-gray'
              }`}
            >
              {scholarshipCoverageLabel(scholarship.coverage)}
            </span>
            <Badge variant={scholarship.status === 'OPEN' ? 'success' : 'default'}>
              {scholarship.status === 'OPEN' ? 'Open' : 'Closed'}
            </Badge>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">{scholarship.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {scholarshipSummary(scholarship) ?? 'Scholarship programme'}
          </p>
        </div>

        <form action={toggleScholarshipStatusAction}>
          <input type="hidden" name="scholarshipId" value={scholarship.id} />
          <button
            type="submit"
            className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
          >
            {scholarship.status === 'OPEN' ? 'Close applications' : 'Reopen applications'}
          </button>
        </form>
      </div>

      <Card className="mb-6">
        <CardContent>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {details.map(([label, value]) => (
              <div key={label} className="rounded-md border border-border p-3">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          {scholarship.description ? (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {scholarship.description}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <section>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold tracking-tight">Applicants</h2>
          <span className="text-xs font-semibold text-muted-foreground">
            {scholarship.applicants.length}
          </span>
        </div>

        {scholarship.applicants.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                No applications yet. The programme appears in players&apos; Transfer Window while
                it is open.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {scholarship.applicants.map((applicant) => (
              <Card key={applicant.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{applicant.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[
                        applicant.position,
                        applicant.age !== null ? `${applicant.age} years old` : null,
                        `applied ${applicant.appliedAt.toLocaleDateString('en-GB')}`,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    {applicant.age !== null && applicant.age < 16 ? (
                      <p className="mt-1 text-xs text-[#4f6b0a]">
                        {applicant.parentLinked
                          ? 'Parent/guardian linked — approval needed before an offer counts.'
                          : 'Under 16 — link a parent before an offer counts.'}
                      </p>
                    ) : null}
                  </div>
                  <Badge variant={STATUS_VARIANT[applicant.status] ?? 'default'}>
                    {applicant.status}
                  </Badge>
                  <div className="flex flex-wrap items-center gap-2">
                    {applicant.parentApproval === 'PENDING' ? (
                      <Badge variant="warning">Waiting for parent</Badge>
                    ) : applicant.status !== 'ACCEPTED' &&
                      applicant.status !== 'REJECTED' &&
                      applicant.status !== 'WITHDRAWN' ? (
                      <>
                        <form action={decideScholarshipApplicationAction}>
                          <input type="hidden" name="applicationId" value={applicant.id} />
                          <input type="hidden" name="decision" value="offer" />
                          <button
                            type="submit"
                            className="rounded-full bg-ink px-3 py-1 text-xs font-bold text-white transition-colors hover:bg-ink/90"
                          >
                            Offer place
                          </button>
                        </form>
                        <form action={decideScholarshipApplicationAction}>
                          <input type="hidden" name="applicationId" value={applicant.id} />
                          <input type="hidden" name="decision" value="decline" />
                          <button
                            type="submit"
                            className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
                          >
                            Decline
                          </button>
                        </form>
                      </>
                    ) : null}
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
