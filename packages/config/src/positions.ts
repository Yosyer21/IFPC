export const POSITIONS = ['POR', 'DEF', 'LAT', 'CAR', 'MED', 'PIV', 'EXT', 'DEL'] as const;
export type Position = (typeof POSITIONS)[number];

export const POSITION_LABELS: Record<Position, string> = {
  POR: 'Goalkeeper',
  DEF: 'Centre-back',
  LAT: 'Full-back',
  CAR: 'Wing-back',
  MED: 'Central midfielder',
  PIV: 'Defensive midfielder',
  EXT: 'Winger',
  DEL: 'Striker',
};
