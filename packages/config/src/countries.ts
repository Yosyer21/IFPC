export const COUNTRIES = ['Spain', 'Mexico', 'Argentina', 'Colombia', 'Brasil', 'Estados Unidos', 'Reino Unido', 'Alemania', 'Francia', 'Italia', 'Portugal', 'Japan'] as const;

export type Country = (typeof COUNTRIES)[number];
