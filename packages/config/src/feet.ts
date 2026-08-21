export const FOOT_OPTIONS = ['right', 'left', 'both'] as const;
export type Foot = (typeof FOOT_OPTIONS)[number];

export const FOOT_LABELS: Record<Foot, string> = {
  right: 'Derecha',
  left: 'Izquierda',
  both: 'Ambidiestro',
};
