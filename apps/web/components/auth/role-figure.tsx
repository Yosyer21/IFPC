'use client';

import type { ReactElement } from 'react';
import type { SignupRole } from '@ifpc/config';

/**
 * Una figura animada por tipo de cuenta, para la elección de perfil:
 *
 * - **Jugador** — un balón que rueda, bota y deja estela.
 * - **Entrenador** — una pizarra donde se dibuja la jugada (flecha) y un punto
 *   recorre la carrera, con el silbato meciéndose.
 * - **Club** — un escudo que late sobre las gradas, que se van encendiendo por
 *   filas entre los haces de los focos.
 *
 * Las animaciones están en `globals.css` (bloque «Elección de perfil», clases
 * `role-*`) y las tres corren a la vez, cada una lo suyo. La variable
 * `--role-play` las para de golpe cuando el sistema pide reducir movimiento.
 */
export function RoleFigure({
  role,
  active = false,
  className = '',
}: {
  role: SignupRole | string;
  active?: boolean;
  className?: string;
}) {
  const Figure = FIGURES[String(role).toUpperCase() as SignupRole] ?? FIGURES.PLAYER;

  return (
    <span
      className={`role-figure inline-block ${className}`}
      data-active={active ? 'true' : 'false'}
      aria-hidden="true"
    >
      <Figure />
    </span>
  );
}

/** Jugador: balón de fútbol con estela sobre el césped. */
function PlayerFigure() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
      <g className="role-idle">
        <path
          d="M8 97h104"
          className="stroke-white/15"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <g className="role-trail">
          <path
            d="M20 56h12"
            className="stroke-brand/40"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="4 5"
            fill="none"
          />
        </g>
        <g className="role-trail" style={{ animationDelay: '90ms' }}>
          <path
            d="M10 74h14"
            className="stroke-brand/60"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="4 5"
            fill="none"
          />
        </g>

        <ellipse className="role-ball-shadow fill-ink" cx="74" cy="98" rx="20" ry="4" />

        <g className="role-ball">
          <g className="role-ball-spin" style={{ transformOrigin: '74px 66px' }}>
            <circle cx="74" cy="66" r="20" className="fill-white" />
            <path d="M74 52l9 6.5-3.4 10.6h-11.2L65 58.5z" className="fill-ink" />
            <path
              d="M74 46v-7M92.5 60.5l6.6-2.2M84 84l3.9 5.6M64 84l-3.9 5.6M55.5 60.5l-6.6-2.2"
              className="stroke-ink"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        </g>
      </g>
    </svg>
  );
}

/** Entrenador: pizarra táctica con la jugada dibujándose. */
function CoachFigure() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
      <g className="role-idle">
        <rect
          x="12"
          y="22"
          width="96"
          height="72"
          rx="10"
          className="fill-ink stroke-white/15"
          strokeWidth="2"
        />
        <path
          d="M60 24v68"
          className="stroke-white/10"
          strokeWidth="2"
          strokeDasharray="4 6"
          fill="none"
        />
        <circle cx="60" cy="58" r="13" className="stroke-white/10" strokeWidth="2" fill="none" />

        <path
          d="M34 44c15-15 39-9 49 9"
          className="role-play stroke-brand"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <path d="M80 51l5.5 4.6-6.6 2.6z" className="fill-brand" />

        <circle cx="30" cy="76" r="5" className="fill-white/70" />
        <circle cx="88" cy="34" r="5" className="fill-white/70" />
        <circle cx="96" cy="70" r="5" className="fill-white/70" />
        <circle r="4.5" cx="34" cy="44" className="role-runner fill-brand" />

        <g className="role-whistle" style={{ transformOrigin: '98px 22px' }}>
          <circle cx="99" cy="22" r="8" className="fill-white/80" />
          <path d="M106 20h8v4h-8z" className="fill-white/60" />
        </g>
      </g>
    </svg>
  );
}

/** Club: escudo que late sobre las gradas, que se van encendiendo por filas. */
function ClubFigure() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
      <g className="role-idle">
        <g className="role-beam">
          <path d="M26 14l13 30H13z" className="fill-brand/20" />
          <path d="M94 14l13 30H81z" className="fill-brand/20" />
          <circle cx="26" cy="12" r="3.5" className="fill-brand" />
          <circle cx="94" cy="12" r="3.5" className="fill-brand" />
        </g>

        {[0, 1, 2].map((row) => (
          <g key={row} className="role-stand" style={{ animationDelay: `${row * 200}ms` }}>
            {Array.from({ length: 11 }).map((_, seat) => (
              <rect
                key={seat}
                x={16 + seat * 8.4}
                y={86 + row * 8}
                width="4"
                height="4"
                rx="1.4"
                className="fill-brand/70"
              />
            ))}
          </g>
        ))}

        <g className="role-crest" style={{ transformOrigin: '60px 52px' }}>
          <path
            d="M60 24l22 8v18c0 14-10 24-22 28-12-4-22-14-22-28V32z"
            className="fill-ink stroke-brand"
            strokeWidth="2.5"
          />
          <path
            d="M60 36l4.5 9.2 10.1 1.5-7.3 7.1 1.7 10-9-4.8-9 4.8 1.7-10-7.3-7.1 10.1-1.5z"
            className="fill-brand"
          />
        </g>
      </g>
    </svg>
  );
}

const FIGURES: Record<SignupRole, () => ReactElement> = {
  PLAYER: PlayerFigure,
  COACH: CoachFigure,
  CLUB: ClubFigure,
};
