export const POSITIONS = ['POR', 'DEF', 'LAT', 'CAR', 'MED', 'PIV', 'EXT', 'DEL'] as const;
export type Position = (typeof POSITIONS)[number];

export const POSITION_LABELS: Record<Position, string> = {
  POR: 'Portero',
  DEF: 'Defensa central',
  LAT: 'Lateral',
  CAR: 'Carrilero',
  MED: 'Mediocentro',
  PIV: 'Pivote',
  EXT: 'Extremo',
  DEL: 'Delantero',
};
