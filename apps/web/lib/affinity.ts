import type { AffinityTarget } from '@ifpc/matching';

/** Necesidad abierta de un club/universidad/colegio (requisito u oportunidad). */
export interface AffinityNeed {
  position?: string | null;
  ageMin?: number | null;
  ageMax?: number | null;
  level?: string | null;
}

export interface AffinityDestination {
  kind: AffinityTarget['kind'];
  name?: string | null;
  country?: string | null;
  city?: string | null;
}

/**
 * Construye el destino de afinidad agregando las necesidades abiertas: las
 * posiciones buscadas, el rango de edad que las cubre y los niveles pedidos.
 */
export function buildAffinityTarget(
  destination: AffinityDestination,
  needs: readonly AffinityNeed[]
): AffinityTarget {
  const ageMins = needs.flatMap((need) => (need.ageMin == null ? [] : [need.ageMin]));
  const ageMaxs = needs.flatMap((need) => (need.ageMax == null ? [] : [need.ageMax]));
  return {
    ...destination,
    positions: needs.map((need) => need.position ?? null),
    ageMin: ageMins.length ? Math.min(...ageMins) : null,
    ageMax: ageMaxs.length ? Math.max(...ageMaxs) : null,
    levels: needs.map((need) => need.level ?? null),
  };
}
