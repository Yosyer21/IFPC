import {
  profileChecklistScore,
  profileCompletionPercentage,
  type ProfileChecklistItem,
  type ProfileChecklistState,
} from '@ifpc/config';
import type { Player } from '@ifpc/types';

/**
 * Player fields that count towards profile completion.
 * Single source of truth for the dashboard, profile and development pages.
 */
type PlayerCompletionFields = Pick<
  Player,
  | 'firstName'
  | 'lastName'
  | 'dateOfBirth'
  | 'nationality'
  | 'position'
  | 'foot'
  | 'heightCm'
  | 'weightKg'
  | 'competitionLevel'
  | 'clubName'
  | 'bio'
>;

/** The completion-checked fields of a player, in display order. */
function playerProfileFields(player: PlayerCompletionFields): unknown[] {
  return [
    player.firstName,
    player.lastName,
    player.dateOfBirth,
    player.nationality,
    player.position,
    player.foot,
    player.heightCm,
    player.weightKg,
    player.competitionLevel,
    player.clubName,
    player.bio,
  ];
}

/**
 * Profile completion (0-100) plus the raw counters the UI shows ("8/11 campos").
 */
export function playerProfileCompletion(player: PlayerCompletionFields): {
  percent: number;
  completed: number;
  total: number;
} {
  const fields = playerProfileFields(player);
  const completed = fields.filter(Boolean).length;
  return { percent: profileCompletionPercentage(fields), completed, total: fields.length };
}

/** Datos que no son columnas de `Player` pero completan la checklist. */
export interface PlayerChecklistExtras {
  /** `User.image`: la foto de perfil. */
  image?: string | null;
  /** Nº de seasons de la trayectoria (`CareerEntry`). */
  careerCount?: number;
}

type PlayerChecklistFields = PlayerCompletionFields & {
  headline?: string | null;
  bannerUrl?: string | null;
};

/**
 * Profile strength: la checklist ponderada de `PROFILE_CHECKLIST` aplicada a
 * los datos reales del player. `next` es el pendiente de más peso: el
 * «siguiente mejor paso» que la UI ofrece como CTA.
 */
export function playerProfileChecklist(
  player: PlayerChecklistFields & PlayerChecklistExtras
): ProfileChecklistState {
  return profileChecklistScore({
    name: Boolean(player.firstName.trim() && player.lastName.trim()),
    dateOfBirth: Boolean(player.dateOfBirth),
    nationality: Boolean(player.nationality),
    position: Boolean(player.position),
    foot: Boolean(player.foot),
    competitionLevel: Boolean(player.competitionLevel),
    physicalData: Boolean(player.heightCm && player.weightKg),
    clubName: Boolean(player.clubName),
    bio: Boolean(player.bio),
    photo: Boolean(player.image),
    banner: Boolean(player.bannerUrl),
    headline: Boolean(player.headline),
    career: (player.careerCount ?? 0) > 0,
  });
}

export interface ProfileNextStep {
  label: string;
  href: string;
  hint: string;
}

/**
 * «Mejor siguiente paso» del medidor de perfil. Si todavía no hay clips, ese es
 * siempre el primero (el libro lo pone como ejemplo): un clip vale más que
 * cualquier campo suelto. Con clips, el pendiente de más peso de la checklist.
 */
export function nextProfileStep(
  checklist: ProfileChecklistState,
  highlightCount: number
): ProfileNextStep | null {
  if (highlightCount <= 0) {
    return {
      label: 'Add a highlight clip',
      href: '/dashboard/player/film-room',
      hint: 'Scouts decide faster when they can see you play. One clip is enough to start.',
    };
  }

  const next: ProfileChecklistItem | null = checklist.next;
  return next ? { label: next.label, href: next.href, hint: next.hint } : null;
}
