export const COUNTRIES = ['España', 'México', 'Argentina', 'Colombia', 'Brasil', 'Estados Unidos', 'Reino Unido', 'Alemania', 'Francia', 'Italia', 'Portugal', 'Japón'] as const;

export type Country = (typeof COUNTRIES)[number];
