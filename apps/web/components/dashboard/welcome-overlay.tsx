'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { PlayerAvatar } from '@/components/player/avatar';
import { IconTarget, IconUsers, IconWhistle } from './icons';
import { nameParts } from '@/lib/names';

/** Copy y icono por rol: qué acaba de recibir la persona. */
const ROLE_WELCOME: Record<string, { label: string; line: string; icon: typeof IconTarget }> = {
  player: {
    label: 'Player',
    line: 'Your development, your goals and the opportunities that fit you are ready.',
    icon: IconTarget,
  },
  coach: {
    label: 'Coach',
    line: 'Your players, your squads and your assessments are ready.',
    icon: IconWhistle,
  },
  club: {
    label: 'Club',
    line: 'Your club profile, your staff and player searches are ready.',
    icon: IconUsers,
  },
};

/**
 * Animación de bienvenida: se muestra **una sola vez**, justo después de crear la
 * cuenta (el alta redirige con `?welcome=1`). Enseña el nombre, el tipo de perfil
 * y qué tiene ya disponible. Al cerrarse limpia el parámetro de la URL.
 */
function Overlay({
  name,
  role,
  imageUrl,
}: {
  name: string;
  role: string;
  imageUrl?: string | null;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(params.get('welcome') === '1');
  const [closing, setClosing] = useState(false);

  const close = useCallback(() => {
    setClosing(true);
    window.setTimeout(() => {
      setVisible(false);
      // Sin el parámetro, no vuelve a salir al recargar ni al navegar.
      router.replace(pathname);
    }, 380);
  }, [pathname, router]);

  useEffect(() => {
    if (!visible) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') close();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, close]);

  if (!visible) return null;

  const { firstName, lastName } = nameParts(name);
  const copy = ROLE_WELCOME[role] ?? {
    label: role,
    line: 'Your dashboard is ready.',
    icon: IconTarget,
  };
  const Icon = copy.icon;

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-ink px-6 transition-opacity duration-300 ${
        closing ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={`Welcome, ${firstName || 'to Future Baller'}`}
    >
      <div className="app-ambient pointer-events-none absolute inset-0" aria-hidden="true" />
      <div
        className="animate-drift pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-brand/25 blur-[130px]"
        aria-hidden="true"
      />
      <div
        className="animate-spin-slow pointer-events-none absolute right-[-6rem] top-[-4rem] h-96 w-96 rounded-full border border-brand/10"
        aria-hidden="true"
      />

      <div className="relative flex max-w-md flex-col items-center text-center">
        <span
          className="animate-fade-up mb-8 text-[11px] font-bold uppercase tracking-[0.3em] text-brand"
          style={{ animationDelay: '80ms' }}
        >
          Welcome to Future Baller
        </span>

        <div className="animate-scale-in relative mb-8" style={{ animationDelay: '160ms' }}>
          <span
            className="absolute inset-0 -z-10 animate-pulse-dot rounded-full bg-brand/30 blur-2xl"
            aria-hidden="true"
          />
          <span className="block rounded-full p-1 ring-2 ring-brand/60">
            <PlayerAvatar firstName={firstName} lastName={lastName} imageUrl={imageUrl} size="lg" />
          </span>
        </div>

        <h1
          className="animate-fade-up text-gradient-brand animate-gradient text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl"
          style={{ animationDelay: '260ms' }}
        >
          {firstName || 'Hello'}
          {lastName ? (
            <>
              <br />
              {lastName}
            </>
          ) : null}
        </h1>

        <span
          className="animate-fade-up mt-5 inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/15 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-brand"
          style={{ animationDelay: '360ms' }}
        >
          <Icon className="h-4 w-4" />
          {copy.label}
        </span>

        <p
          className="animate-fade-up mt-5 text-base leading-relaxed text-mist/70"
          style={{ animationDelay: '440ms' }}
        >
          {copy.line}
        </p>

        <button
          type="button"
          onClick={close}
          className="glow animate-fade-up mt-9 inline-flex items-center justify-center rounded-full bg-brand px-8 py-3.5 text-base font-bold text-ink transition-transform hover:scale-[1.03]"
          style={{ animationDelay: '560ms' }}
        >
          Let&apos;s go
        </button>

        <p
          className="animate-fade-up mt-4 text-xs text-mist/45"
          style={{ animationDelay: '640ms' }}
        >
          You can change your details any time in Settings.
        </p>
      </div>
    </div>
  );
}

/** Envuelto en `Suspense` porque usa `useSearchParams` dentro del dashboard. */
export function WelcomeOverlay(props: { name: string; role: string; imageUrl?: string | null }) {
  return (
    <Suspense fallback={null}>
      <Overlay {...props} />
    </Suspense>
  );
}
