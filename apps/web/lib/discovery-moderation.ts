import { prisma } from '@ifpc/database';

/**
 * Moderación de Discovery: cola de denuncias, traza de acciones y los tipos que
 * comparten las server actions con el panel de admin.
 */

/** Acciones que quedan registradas en la traza de moderación. */
const MODERATION_ACTIONS = [
  'HIDDEN',
  'PUBLISHED',
  'PINNED',
  'UNPINNED',
  'DELETED',
  'RESOLVED',
] as const;
export type ModerationAction = (typeof MODERATION_ACTIONS)[number];

/** ¿Es una acción válida de la traza? */
export function isModerationAction(value: string): value is ModerationAction {
  return MODERATION_ACTIONS.some((action) => action === value);
}

/**
 * Registra una acción de moderación. La traza es informativa: si falla, nunca
 * debe impedir que la moderación se aplique.
 */
export async function logModeration(input: {
  actorId: string;
  postId: string;
  action: ModerationAction;
  notes?: string | null;
}): Promise<void> {
  // Defensa en profundidad: la traza solo admite acciones conocidas.
  if (!isModerationAction(input.action)) return;

  try {
    await prisma.moderationLog.create({
      data: {
        actorId: input.actorId,
        postId: input.postId,
        action: input.action,
        notes: input.notes ?? null,
      },
    });
  } catch {
    // Sin traza, pero la moderación hecha.
  }
}

export interface ReportedPost {
  id: string;
  type: string;
  status: string;
  title: string | null;
  body: string | null;
  pinned: boolean;
  createdAt: Date;
  author: { id: string; name: string; role: string };
  reports: { id: string; reason: string; createdAt: Date; reporter: { id: string; name: string } }[];
}

/**
 * Cola de moderación: publicaciones con denuncias **pendientes**, ordenadas por
 * número de denuncias y, a igualdad, por la más reciente.
 */
export async function listReportedPosts(limit = 20): Promise<ReportedPost[]> {
  const reports = await prisma.postReport.findMany({
    where: { resolvedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { reporter: { select: { id: true, name: true } } },
  });

  // Se agrupa por publicación respetando el orden de la denuncia más reciente.
  const grouped = new Map<string, typeof reports>();
  for (const report of reports) {
    const list = grouped.get(report.postId) ?? [];
    list.push(report);
    grouped.set(report.postId, list);
  }

  const ranked = [...grouped.entries()]
    .sort(([, a], [, b]) => b.length - a.length)
    .slice(0, limit);
  if (ranked.length === 0) return [];

  const rows = await prisma.post.findMany({
    where: { id: { in: ranked.map(([postId]) => postId) } },
    select: {
      id: true,
      type: true,
      status: true,
      title: true,
      body: true,
      pinnedAt: true,
      createdAt: true,
      author: { select: { id: true, name: true, role: true } },
    },
  });
  const byId = new Map(rows.map((row) => [row.id, row]));

  return ranked.flatMap(([postId, postReports]) => {
    const row = byId.get(postId);
    if (!row) return [];
    return [
      {
        id: row.id,
        type: row.type,
        status: row.status,
        title: row.title,
        body: row.body,
        pinned: row.pinnedAt !== null,
        createdAt: row.createdAt,
        author: row.author,
        reports: postReports.map((report) => ({
          id: report.id,
          reason: report.reason,
          createdAt: report.createdAt,
          reporter: report.reporter,
        })),
      },
    ];
  });
}

export interface ModerationLogEntry {
  id: string;
  postId: string;
  action: string;
  notes: string | null;
  createdAt: Date;
  actor: { id: string; name: string };
}

/** Traza de moderación más reciente. */
export async function listModerationLog(limit = 20): Promise<ModerationLogEntry[]> {
  return prisma.moderationLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      postId: true,
      action: true,
      notes: true,
      createdAt: true,
      actor: { select: { id: true, name: true } },
    },
  });
}
