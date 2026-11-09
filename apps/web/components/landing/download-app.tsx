import Link from 'next/link';
import { IconArrowRight, IconCheck } from './icons';

/** Icono de descarga (no está en el set de la landing). */
function IconDownload({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M4 21h16" />
    </svg>
  );
}

const PERKS = [
  'Your profile, Player ID and transfer window in your pocket',
  'Upload clips and documents straight from your phone',
  'Same account as the web — nothing to set up',
];

/**
 * Sección de descarga de la app Android. El APK vive en
 * `apps/web/public/downloads/future-baller.apk` y lo compila
 * `mobile/scripts/build-apk.sh`.
 */
export function DownloadApp() {
  return (
    <section id="download-app" className="scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-ink px-5 py-9 text-white sm:px-10 sm:py-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-brand/20 blur-[120px]"
          />
          <div
            aria-hidden="true"
            className="bg-bars-faint-invert pointer-events-none absolute inset-0 opacity-40"
          />

          <div className="relative grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-brand px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-ink">
                Mobile app · Android
              </span>

              <h2 className="mt-5 text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl">
                Take Future Baller
                <br />
                <span className="text-gradient">everywhere</span>
              </h2>

              <p className="mt-4 max-w-lg text-base leading-relaxed text-white/65">
                Install the app on your phone and keep your development, your Player ID and the
                transfer window one tap away — even on the way to training.
              </p>

              <ul className="mt-6 flex flex-col gap-2.5">
                {PERKS.map((perk) => (
                  <li key={perk} className="flex items-start gap-2.5 text-sm text-white/80">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand">
                      <IconCheck className="h-3.5 w-3.5" />
                    </span>
                    {perk}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  href="/downloads/future-baller.apk"
                  download
                  className="glow inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-bold text-ink transition-transform hover:scale-[1.03]"
                >
                  <IconDownload className="h-4 w-4" />
                  Download the APK
                </a>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Continue in browser <IconArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-white/45">
                Android 6.0+ · v1.0.0 · ~60 KB · The APK is installed directly, outside the Play
                Store: if your phone asks, allow installs from this source.
              </p>
            </div>

            {/* Maqueta del móvil: mismo lenguaje visual que la app real. */}
            <div className="relative mx-auto w-[230px] sm:w-[250px]">
              <div
                aria-hidden="true"
                className="absolute -inset-8 rounded-full bg-brand/15 blur-3xl"
              />
              <div className="relative rounded-[2.3rem] border border-white/15 bg-white/5 p-2 shadow-2xl">
                <div className="relative overflow-hidden rounded-[1.8rem] bg-[#0d1117]">
                  <div className="flex items-center justify-between px-4 pt-3 text-[10px] text-white/45">
                    <span>9:41</span>
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                      <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                      <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                    </span>
                  </div>

                  <div className="px-4 pb-4 pt-4">
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-brand">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand" /> Window open
                    </div>
                    <p className="mt-2 font-display text-2xl uppercase leading-[0.95] tracking-tight">
                      Transfer
                      <br />
                      window
                    </p>

                    <div className="mt-3 grid grid-cols-3 gap-1.5">
                      {[
                        ['1', 'Offers'],
                        ['3', 'Matches'],
                        ['1', 'Apps'],
                      ].map(([value, label]) => (
                        <div
                          key={label}
                          className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5"
                        >
                          <div className="text-sm font-black tabular-nums text-white">{value}</div>
                          <div className="text-[7px] font-semibold uppercase tracking-wider text-white/40">
                            {label}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-2.5 rounded-xl border border-white/10 bg-white/5 p-2.5">
                      <div className="flex items-center justify-between text-[7px] font-bold uppercase tracking-wider">
                        <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-white/70">
                          Trial
                        </span>
                        <span className="text-brand">New offer</span>
                      </div>
                      <p className="mt-1.5 text-[11px] font-semibold leading-tight text-white">
                        Demo Club trial invitation
                      </p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full w-[72%] rounded-full bg-brand" />
                      </div>
                    </div>
                  </div>

                  <div className="mx-auto mb-2 h-1 w-16 rounded-full bg-white/20" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
