import Link from 'next/link';
import { Plus, Target } from 'lucide-react';

export interface PlayerIdStat {
  label: string;
  value: string;
  pct: number;
}

export interface PlayerIdSeason {
  year: string;
  current?: boolean;
  crest: string;
  club: string;
  category: string;
  stats: PlayerIdStat[];
}

export interface PlayerIdData {
  name: string;
  academyLine: string;
  career: { value: string; label: string }[];
  details: [string, string][];
  /** Reparto de goles; si falta, la sección «How I score» se oculta. */
  howIScore?: { headers?: number; rightFoot?: number; leftFoot?: number };
  seasons: PlayerIdSeason[];
  /** Si se pasan, los CTAs navegan a esas rutas (vista real). */
  addSeasonHref?: string;
  addPhotoHref?: string;
}

const DEMO: PlayerIdData = {
  name: 'Demo Player',
  academyLine: 'Future Ballers Academy · U17 · Forward',
  career: [
    { value: '25', label: 'Goals' },
    { value: '55', label: 'Matches' },
    { value: '15', label: 'Assists' },
    { value: '0.45', label: 'Goals per match' },
  ],
  details: [
    ['Age', '17'],
    ['Foot', 'Right'],
    ['Height', '172 cm'],
    ['Position', 'Forward'],
  ],
  howIScore: { headers: 4, rightFoot: 15, leftFoot: 6 },
  seasons: [
    {
      year: '25/26',
      current: true,
      crest: 'RF',
      club: 'Riverside FC',
      category: 'U17 · Forward',
      stats: [
        { label: 'Matches', value: '18', pct: 82 },
        { label: 'Goals', value: '12', pct: 72 },
        { label: 'Assists', value: '6', pct: 55 },
        { label: 'Goal inv.', value: '18', pct: 78 },
      ],
    },
    {
      year: '24/25',
      crest: 'RF',
      club: 'Riverside FC',
      category: 'U16 · Forward',
      stats: [
        { label: 'Matches', value: '22', pct: 68 },
        { label: 'Goals', value: '9', pct: 48 },
        { label: 'Assists', value: '5', pct: 40 },
        { label: 'Goal inv.', value: '14', pct: 60 },
      ],
    },
    {
      year: '23/24',
      crest: 'CA',
      club: 'City Academy',
      category: 'U15 · Midfield',
      stats: [
        { label: 'Matches', value: '20', pct: 62 },
        { label: 'Goals', value: '4', pct: 26 },
        { label: 'Assists', value: '6', pct: 44 },
        { label: 'Goal inv.', value: '10', pct: 44 },
      ],
    },
  ],
};

function Pitch() {
  return (
    <svg viewBox="0 0 120 80" className="h-24 w-full" aria-hidden="true">
      <rect x="1" y="1" width="118" height="78" rx="5" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1.2" />
      <line x1="60" y1="1" x2="60" y2="79" stroke="rgba(255,255,255,0.28)" strokeWidth="1.2" />
      <circle cx="60" cy="40" r="11" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1.2" />
      <rect x="1" y="22" width="15" height="36" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1.2" />
      <rect x="104" y="22" width="15" height="36" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1.2" />
      <circle cx="96" cy="34" r="3.4" fill="#d1fc2a" />
    </svg>
  );
}

function Silhouette() {
  return (
    <svg viewBox="0 0 200 200" className="absolute -right-4 bottom-0 h-56 w-56" aria-hidden="true">
      <g fill="#262626">
        <circle cx="120" cy="42" r="16" />
        <rect x="104" y="58" width="34" height="58" rx="16" />
        <rect x="98" y="72" width="15" height="64" rx="7" transform="rotate(20 105 72)" />
        <rect x="128" y="70" width="15" height="68" rx="7" transform="rotate(-24 135 70)" />
      </g>
    </svg>
  );
}

function AddSeasonCta({ href }: { href?: string }) {
  const cls =
    'inline-flex items-center gap-2 rounded-full bg-[#111] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black';
  return href ? (
    <Link href={href} className={cls}>
      <Plus className="h-4 w-4" /> Add season
    </Link>
  ) : (
    <button type="button" className={cls}>
      <Plus className="h-4 w-4" /> Add season
    </button>
  );
}

function AddPhotoCta({ href }: { href?: string }) {
  const cls =
    'mt-6 inline-flex items-center gap-2 rounded-full bg-[#d1fc2a] px-4 py-2.5 text-sm font-semibold text-[#0a0a0a] transition-colors hover:brightness-95';
  return href ? (
    <Link href={href} className={cls}>
      <Plus className="h-4 w-4" /> Add your photo
    </Link>
  ) : (
    <button type="button" className={cls}>
      <Plus className="h-4 w-4" /> Add your photo
    </button>
  );
}

export function PlayerIdView({ data = DEMO }: { data?: PlayerIdData }) {
  const { name, academyLine, career, details, howIScore, seasons, addSeasonHref, addPhotoHref } = data;
  const gridCols = howIScore ? 'md:grid-cols-3' : 'md:grid-cols-2';

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-[#111] sm:text-4xl">Player ID</h1>
          <p className="mt-1 text-sm text-[#6b7280]">Your football CV — development, seasons and how you score.</p>
        </div>
        <AddSeasonCta href={addSeasonHref} />
      </div>

      <section className="relative overflow-hidden rounded-3xl bg-[#1a1a1a] p-6 text-white sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <Silhouette />
          <div className="absolute -left-8 top-0 h-[170%] w-[2px] rotate-[22deg] bg-[#d1fc2a]" />
        </div>

        <div className="relative">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/50">{academyLine}</p>
          <h2 className="mt-2 font-black uppercase leading-none text-white text-4xl sm:text-6xl">{name}</h2>

          <p className="mt-6 text-[11px] uppercase tracking-[0.18em] text-white/50">Career summary</p>
          <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {career.map((stat) => (
              <div key={stat.label}>
                <div className="font-black leading-none text-[#d1fc2a] text-3xl sm:text-4xl">{stat.value}</div>
                <div className="mt-1 text-[10px] uppercase tracking-wide text-white/50">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className={`mt-6 grid gap-6 border-t border-white/10 pt-6 ${gridCols}`}>
            {howIScore ? (
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/50">How I score</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d1fc2a] text-[#0a0a0a]">
                    <Target className="h-4 w-4" />
                  </span>
                  <span className="font-semibold text-white">{howIScore.headers ?? 0} headers</span>
                </div>
                <ul className="mt-2 space-y-1 text-sm text-white/70">
                  <li>{howIScore.rightFoot ?? 0} right foot</li>
                  <li>{howIScore.leftFoot ?? 0} left foot</li>
                </ul>
              </div>
            ) : null}

            <div>
              <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/50">My position</p>
              <Pitch />
            </div>

            <div>
              <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/50">Player details</p>
              <dl className="space-y-1.5 text-sm">
                {details.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between border-b border-white/10 pb-1.5">
                    <dt className="text-white/50">{label}</dt>
                    <dd className="font-semibold text-[#d1fc2a]">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <AddPhotoCta href={addPhotoHref} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-xl font-black uppercase tracking-tight text-[#111]">The journey</h2>
        {seasons.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d1d5db] bg-white px-5 py-8 text-center">
            <p className="text-sm text-[#6b7280]">No seasons yet — add your first club and season.</p>
            {addSeasonHref ? (
              <Link href={addSeasonHref} className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#111] px-4 py-2 text-sm font-semibold text-white">
                <Plus className="h-4 w-4" /> Add season
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col">
            {seasons.map((season, index) => (
              <div key={`${season.year}-${season.club}`} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={
                      season.current
                        ? 'flex h-14 w-14 items-center justify-center rounded-full bg-[#d1fc2a] text-[11px] font-bold text-[#0a0a0a]'
                        : 'flex h-14 w-14 items-center justify-center rounded-full border border-[#d1d5db] text-[11px] font-semibold text-[#6b7280]'
                    }
                  >
                    {season.year}
                  </div>
                  {index < seasons.length - 1 ? <span className="my-1 w-px flex-1 bg-[#e5e7eb]" /> : null}
                </div>

                <div
                  className={
                    season.current
                      ? 'mb-4 flex-1 rounded-2xl bg-[#1a1a1a] p-5 text-white'
                      : 'mb-4 flex-1 rounded-2xl border border-[#e5e7eb] bg-white p-5 text-[#111]'
                  }
                >
                  {season.current ? (
                    <span className="inline-flex rounded-md bg-[#d1fc2a] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0a0a0a]">
                      Current team
                    </span>
                  ) : null}

                  <div className="mt-2 flex items-center gap-3">
                    <span
                      className={
                        season.current
                          ? 'flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-xs font-black text-white'
                          : 'flex h-10 w-10 items-center justify-center rounded-lg bg-[#f1f2f4] text-xs font-black text-[#111]'
                      }
                    >
                      {season.crest}
                    </span>
                    <div>
                      <p className="font-bold leading-tight">{season.club}</p>
                      <p className={season.current ? 'text-xs text-white/50' : 'text-xs text-[#6b7280]'}>{season.category}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {season.stats.map((stat) => (
                      <div key={stat.label}>
                        <div className={season.current ? 'font-black leading-none text-white text-2xl' : 'font-black leading-none text-[#111] text-2xl'}>
                          {stat.value}
                        </div>
                        <div className={season.current ? 'mt-1 text-[10px] uppercase tracking-wide text-white/40' : 'mt-1 text-[10px] uppercase tracking-wide text-[#9aa0a6]'}>
                          {stat.label}
                        </div>
                        <div className={season.current ? 'mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10' : 'mt-2 h-1 w-full overflow-hidden rounded-full bg-[#eef0f2]'}>
                          <div
                            className={season.current ? 'h-full rounded-full bg-[#d1fc2a]' : 'h-full rounded-full bg-[#93c5fd]'}
                            style={{ width: `${Math.max(4, Math.min(100, stat.pct))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
