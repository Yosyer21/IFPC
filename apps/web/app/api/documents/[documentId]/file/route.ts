import { NextResponse } from 'next/server';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { canContactPlayers } from '@/lib/verification';
import { isVisibleToClubs, isVisibleToSchools } from '@/lib/minor';
import { readPrivateObject } from '@/lib/storage/private';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface DocumentPlayer {
  playerId: string;
  player: {
    userId: string;
    dateOfBirth: Date | null;
    parents: { idVisibleToClubs: boolean; idVisibleToSchools: boolean }[];
  };
}

/**
 * ¿Puede este usuario abrir el documento? Se falla cerrado: solo el dueño, su
 * padre, un admin o personal verificado con relación real con el jugador.
 */
async function canReadDocument(
  userId: string,
  role: string,
  document: DocumentPlayer
): Promise<boolean> {
  if (role === 'ADMIN' || document.player.userId === userId) return true;

  if (role === 'PARENT') {
    return Boolean(
      await prisma.parentChild.findFirst({
        where: { playerId: document.playerId, parent: { userId } },
        select: { id: true },
      })
    );
  }

  if (role === 'CLUB') {
    const club = await prisma.club.findUnique({
      where: { userId },
      select: { verified: true, backgroundChecked: true },
    });
    if (club) {
      return (
        canContactPlayers(club) &&
        isVisibleToClubs(document.player.dateOfBirth, document.player.parents)
      );
    }
    const staff = await prisma.clubStaff.findFirst({
      where: { userId, backgroundChecked: true, club: { verified: true } },
      select: { id: true, club: { select: { backgroundChecked: true } } },
    });
    return Boolean(
      staff?.club.backgroundChecked &&
        isVisibleToClubs(document.player.dateOfBirth, document.player.parents)
    );
  }

  if (role === 'UNIVERSITY' || role === 'SCHOOL') {
    const organisation =
      role === 'UNIVERSITY'
        ? await prisma.university.findUnique({
            where: { userId },
            select: { verified: true },
          })
        : await prisma.school.findUnique({
            where: { userId },
            select: { verified: true },
          });
    return Boolean(
      organisation?.verified &&
        isVisibleToSchools(document.player.dateOfBirth, document.player.parents)
    );
  }

  if (role === 'COACH') {
    const coach = await prisma.coach.findUnique({
      where: { userId },
      select: { id: true, verified: true, backgroundChecked: true },
    });
    if (!coach?.verified || !coach.backgroundChecked) return false;
    return Boolean(
      await prisma.coachPlayer.findFirst({
        where: { coachId: coach.id, playerId: document.playerId },
        select: { id: true },
      })
    );
  }

  if (role === 'AGENT') {
    const agent = await prisma.agent.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!agent) return false;
    return Boolean(
      await prisma.agentPlayer.findFirst({
        where: { agentId: agent.id, playerId: document.playerId, status: 'ACTIVE' },
        select: { id: true },
      })
    );
  }

  return false;
}

/** GET /api/documents/[documentId]/file — descarga autenticada de un documento. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      playerId: true,
      storageKey: true,
      mimeType: true,
      player: {
        select: {
          userId: true,
          dateOfBirth: true,
          parents: {
            select: { idVisibleToClubs: true, idVisibleToSchools: true },
          },
        },
      },
    },
  });
  if (!document || !document.storageKey) {
    return new NextResponse('Not found', { status: 404 });
  }

  const allowed = await canReadDocument(session.user.id, session.user.role, document);
  if (!allowed) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const file = await readPrivateObject(document.storageKey);
  if (!file) {
    return new NextResponse('Not found', { status: 404 });
  }

  const ext = document.storageKey.split('.').pop() ?? 'bin';
  const headers = new Headers();
  headers.set('content-type', document.mimeType ?? 'application/octet-stream');
  headers.set(
    'content-disposition',
    `attachment; filename="document-${document.id}.${ext}"`
  );
  headers.set('content-length', String(file.byteLength));
  headers.set('cache-control', 'private, no-store');
  headers.set('x-content-type-options', 'nosniff');

  return new NextResponse(new Uint8Array(file), { status: 200, headers });
}
