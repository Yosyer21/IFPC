import { POSITIONS, POSITION_LABELS, type Position } from '@ifpc/config';
/**
 * Geometría de la cancha para el perfil del jugador.
 *
 * Lógica **pura**: mapea la posición guardada (`Player.position`) a un punto y a
 * la zona que cubre sobre un lienzo vertical (atacando hacia arriba), en
 * porcentajes 0-100 → la misma geometría sirve para cualquier tamaño de pantalla.
 *   x: 0 = banda izquierda, 100 = banda derecha.
 *   y: 0 = arco rival (ataque), 100 = arco propio.
 *
 * Las posiciones de banda (`LAT`, `CAR`, `EXT`) no guardan **el lado** en el
 * perfil, así que se marcan las dos bandas en lugar de suponer una.
 */

export interface PitchZone {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PitchMarker {
  x: number;
  y: number;
}

/** Familia de la posición: agrupa la leyenda y el icono del marcador. */
export type PitchGroup = 'Goalkeeper' | 'Defence' | 'Midfield' | 'Attack';

export interface PitchSpot {
  position: Position;
  label: string;
  group: PitchGroup;
  /** Uno o dos puntos (las bandas) donde se pinta el jugador. */
  markers: PitchMarker[];
  /** Zonas que cubre la posición sobre el campo. */
  zones: PitchZone[];
  /** `true` cuando la posición es de banda (el lado no está definido). */
  wide: boolean;
}

/** ¿Es una posición con representación en la cancha? */
export function isPitchPosition(value: string | null | undefined): value is Position {
  return typeof value === 'string' && (POSITIONS as readonly string[]).includes(value);
}

/** Punto del marcador en la banda izquierda (el derecho es su espejo). */
const FLANK_X = { LAT: 15, CAR: 12, EXT: 13 } as const;

const SPOTS: Record<Position, Omit<PitchSpot, 'position' | 'label'>> = {
  POR: {
    group: 'Goalkeeper',
    wide: false,
    markers: [{ x: 50, y: 91 }],
    zones: [{ x: 28, y: 87, w: 44, h: 13 }],
  },
  DEF: {
    group: 'Defence',
    wide: false,
    markers: [{ x: 50, y: 78 }],
    zones: [{ x: 18, y: 68, w: 64, h: 18 }],
  },
  LAT: {
    group: 'Defence',
    wide: true,
    markers: [
      { x: FLANK_X.LAT, y: 71 },
      { x: 100 - FLANK_X.LAT, y: 71 },
    ],
    zones: [
      { x: 2, y: 62, w: 26, h: 20 },
      { x: 72, y: 62, w: 26, h: 20 },
    ],
  },
  CAR: {
    group: 'Defence',
    wide: true,
    markers: [
      { x: FLANK_X.CAR, y: 54 },
      { x: 100 - FLANK_X.CAR, y: 54 },
    ],
    zones: [
      { x: 2, y: 42, w: 24, h: 26 },
      { x: 74, y: 42, w: 24, h: 26 },
    ],
  },
  PIV: {
    group: 'Midfield',
    wide: false,
    markers: [{ x: 50, y: 61 }],
    zones: [{ x: 33, y: 53, w: 34, h: 16 }],
  },
  MED: {
    group: 'Midfield',
    wide: false,
    markers: [{ x: 50, y: 44 }],
    zones: [{ x: 28, y: 31, w: 44, h: 26 }],
  },
  EXT: {
    group: 'Attack',
    wide: true,
    markers: [
      { x: FLANK_X.EXT, y: 28 },
      { x: 100 - FLANK_X.EXT, y: 28 },
    ],
    zones: [
      { x: 2, y: 14, w: 26, h: 28 },
      { x: 72, y: 14, w: 26, h: 28 },
    ],
  },
  DEL: {
    group: 'Attack',
    wide: false,
    markers: [{ x: 50, y: 19 }],
    zones: [{ x: 30, y: 9, w: 40, h: 20 }],
  },
};

/** Posición lista para pintar en la cancha; `null` si no hay posición válida. */
export function pitchSpot(position: string | null | undefined): PitchSpot | null {
  if (!isPitchPosition(position)) return null;
  return { position, label: POSITION_LABELS[position], ...SPOTS[position] };
}

/**
 * Centro y tamaño del **halo** que representa una zona (el marcador no dibuja
 * ningún recuadro): el centro es el de la zona y el tamaño se mide en porcentaje
 * del ancho del campo, así el halo sale redondo sea cual sea la proporción.
 */
export function zoneGlow(zone: PitchZone): { x: number; y: number; size: number } {
  return {
    x: zone.x + zone.w / 2,
    y: zone.y + zone.h / 2,
    size: zone.w,
  };
}
