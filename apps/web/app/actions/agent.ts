'use server';

import { redirect } from 'next/navigation';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import type { ActionState } from './auth';

const str = (formData: FormData, key: string): string | null => {
  const value = formData.get(key);
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

async function getAgent() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.agent.findUnique({ where: { userId: session.user.id } });
}

/** Envía un mensaje a una conversación en la que el agente participa. */
export async function sendMessageAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  const conversationId = str(formData, 'conversationId');
  const body = str(formData, 'body');
  if (!conversationId || !body) return;

  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: { conversationId, userId: session.user.id },
    },
  });
  if (!participant) return;

  await prisma.message.create({
    data: { conversationId, senderId: session.user.id, body },
  });
  redirect('/dashboard/agent/communications');
}

export async function addPlayerAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const agent = await getAgent();
  if (!agent) {
    return { error: 'Agente no válido.' };
  }
  const email = str(formData, 'email');
  if (!email) {
    return { error: 'Email del jugador obligatorio.' };
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  const player = user ? await prisma.player.findUnique({ where: { userId: user.id } }) : null;
  if (!player) {
    return { error: 'No se encontró un jugador con ese email.' };
  }

  try {
    await prisma.agentPlayer.upsert({
      where: { agentId_playerId: { agentId: agent.id, playerId: player.id } },
      update: {},
      create: { agentId: agent.id, playerId: player.id },
    });
  } catch {
    return { error: 'No se pudo añadir al jugador.' };
  }

  redirect('/dashboard/agent/players');
}

export async function createSubmissionAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const agent = await getAgent();
  if (!agent) {
    return { error: 'Agente no válido.' };
  }
  const playerId = str(formData, 'playerId');
  const clubId = str(formData, 'clubId');
  if (!playerId || !clubId) {
    return { error: 'Selecciona jugador y club.' };
  }

  try {
    await prisma.submission.create({
      data: {
        playerId,
        clubId,
        agentId: agent.id,
        notes: str(formData, 'notes'),
        stage: 'SUBMISSION',
        status: 'PENDING',
      },
    });
  } catch {
    return { error: 'No se pudo crear el envío.' };
  }

  redirect('/dashboard/agent/submissions');
}
