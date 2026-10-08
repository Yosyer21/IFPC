import { prisma } from '@ifpc/database';

/**
 * Privacidad social del feed: **bloquear** y **silenciar**.
 *
 * - `BLOCK`: mutuo. Ninguno de los dos ve el contenido del otro ni puede
 *   interactuar (comentar o seguir). Bloquear corta los seguimientos en ambos
 *   sentidos.
 * - `MUTE`: unilateral. Solo dejo de ver su contenido; la otra persona no lo sabe.
 *
 * Nota: en el espejo público no hay espectador identificable, así que los
 * bloqueos no filtran ahí (ver docs/technical/discovery.md).
 */

export type PrivacyKind = 'BLOCK' | 'MUTE';

/** Identificadores que el espectador no debe ver (bloqueos bidireccionales + silenciados). */
export async function hiddenAuthorIds(viewerId?: string | null): Promise<string[]> {
  if (!viewerId) return [];

  const rules = await prisma.privacyRule.findMany({
    where: { OR: [{ ownerId: viewerId }, { targetId: viewerId, kind: 'BLOCK' }] },
    select: { ownerId: true, targetId: true, kind: true },
    take: 500,
  });

  const ids = new Set<string>();
  for (const rule of rules) {
    if (rule.kind === 'BLOCK') {
      ids.add(rule.ownerId === viewerId ? rule.targetId : rule.ownerId);
    } else if (rule.ownerId === viewerId) {
      ids.add(rule.targetId);
    }
  }
  return [...ids];
}

/** ¿Hay algún bloqueo entre los dos perfiles (en cualquier sentido)? */
export async function hasBlockBetween(firstId: string, secondId: string): Promise<boolean> {
  if (firstId === secondId) return false;

  const block = await prisma.privacyRule.findFirst({
    where: {
      kind: 'BLOCK',
      OR: [
        { ownerId: firstId, targetId: secondId },
        { ownerId: secondId, targetId: firstId },
      ],
    },
    select: { id: true },
  });
  return block !== null;
}

/** Estado de privacidad que **yo** he aplicado a otro perfil (botones del muro). */
export async function getPrivacyState(
  targetId: string,
  viewerId?: string | null
): Promise<{ blocked: boolean; muted: boolean }> {
  if (!viewerId || viewerId === targetId) {
    return { blocked: false, muted: false };
  }

  const rules = await prisma.privacyRule.findMany({
    where: { ownerId: viewerId, targetId },
    select: { kind: true },
  });

  return {
    blocked: rules.some((rule) => rule.kind === 'BLOCK'),
    muted: rules.some((rule) => rule.kind === 'MUTE'),
  };
}

/**
 * Alterna una regla de privacidad. Devuelve si queda activa tras el cambio.
 * Cambiar de silencio a bloqueo (o al revés) actualiza la regla existente.
 */
export async function togglePrivacyRule(input: {
  ownerId: string;
  targetId: string;
  kind: PrivacyKind;
}): Promise<{ active: boolean }> {
  if (input.ownerId === input.targetId) {
    return { active: false };
  }

  const existing = await prisma.privacyRule.findUnique({
    where: { ownerId_targetId: { ownerId: input.ownerId, targetId: input.targetId } },
    select: { id: true, kind: true },
  });

  if (existing && existing.kind === input.kind) {
    await prisma.privacyRule.delete({ where: { id: existing.id } });
    return { active: false };
  }

  if (existing) {
    await prisma.privacyRule.update({ where: { id: existing.id }, data: { kind: input.kind } });
  } else {
    await prisma.privacyRule.create({ data: input });
  }

  if (input.kind === 'BLOCK') {
    // Un bloqueo corta los seguimientos en los dos sentidos.
    await prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: input.ownerId, followingId: input.targetId },
          { followerId: input.targetId, followingId: input.ownerId },
        ],
      },
    });
  }

  return { active: true };
}

/** ¿Puede el espectador comentar según la política del autor y su privacidad? */
export async function canComment(input: {
  viewerId: string;
  authorId: string;
  policy: string;
}): Promise<boolean> {
  if (input.viewerId === input.authorId) return true;
  if (input.policy === 'NOBODY') return false;
  if (await hasBlockBetween(input.viewerId, input.authorId)) return false;

  if (input.policy === 'FOLLOWERS') {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId: input.viewerId, followingId: input.authorId },
      },
      select: { id: true },
    });
    return follow !== null;
  }

  return true;
}
