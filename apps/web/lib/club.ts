import { CLUB_PROFILE_CHECKLIST, profileChecklistScore, type ProfileChecklistState } from '@ifpc/config';
import type { Club } from '@ifpc/types';

/** Campos del club que puntúan en la checklist de su perfil. */
type ClubChecklistFields = Pick<
  Club,
  | 'name'
  | 'country'
  | 'city'
  | 'league'
  | 'foundedYear'
  | 'description'
  | 'headline'
  | 'logoUrl'
  | 'bannerUrl'
  | 'tags'
>;

/** Datos que no son columnas de `Club` pero completan la checklist. */
export interface ClubChecklistExtras {
  /** Nº de oportunidades publicadas por el club. */
  opportunityCount?: number;
}

/** Ubicación del club lista para pintar («Valencia, Spain»), o `null`. */
export function clubLocation(club: Pick<Club, 'city' | 'country'>): string | null {
  const parts = [club.city?.trim(), club.country?.trim()].filter((part): part is string => !!part);
  return parts.length > 0 ? parts.join(', ') : null;
}

/**
 * Profile strength del club: la checklist ponderada de `CLUB_PROFILE_CHECKLIST`
 * aplicada a los datos reales. `next` es el pendiente de más peso, el «siguiente
 * mejor paso» que la UI ofrece como CTA. Mismo contrato que el del player
 * (`playerProfileChecklist`), para que la tarjeta de la UI sea la misma.
 */
export function clubProfileChecklist(
  club: ClubChecklistFields & ClubChecklistExtras
): ProfileChecklistState {
  return profileChecklistScore(
    {
      name: Boolean(club.name?.trim()),
      country: Boolean(club.country?.trim()),
      city: Boolean(club.city),
      league: Boolean(club.league),
      foundedYear: Boolean(club.foundedYear),
      description: Boolean(club.description),
      headline: Boolean(club.headline),
      logo: Boolean(club.logoUrl),
      banner: Boolean(club.bannerUrl),
      tags: (club.tags?.length ?? 0) > 0,
      opportunity: (club.opportunityCount ?? 0) > 0,
    },
    CLUB_PROFILE_CHECKLIST
  );
}
