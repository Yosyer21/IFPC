'use server';

import { redirect } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import type { ActionState } from './auth';

const str = (formData: FormData, key: string): string | null => {
  const value = formData.get(key);
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

const num = (formData: FormData, key: string): number | null => {
  const value = formData.get(key);
  if (typeof value !== 'string' || !value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

async function getScout() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.scout.findUnique({ where: { userId: session.user.id } });
}

export async function createScoutingReportAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const scout = await getScout();
  if (!scout) {
    return { error: 'Ojeador no válido.' };
  }
  const playerId = str(formData, 'playerId');
  const rating = num(formData, 'rating');
  if (!playerId || rating === null || rating < 1 || rating > 10) {
    return { error: 'Datos del informe no válidos.' };
  }

  try {
    await prisma.scoutingReport.create({
      data: {
        scoutId: scout.id,
        playerId,
        rating,
        strengths: str(formData, 'strengths'),
        weaknesses: str(formData, 'weaknesses'),
        notes: str(formData, 'notes'),
      },
    });
  } catch {
    return { error: 'No se pudo guardar el informe.' };
  }

  redirect('/dashboard/scout/scouting-reports');
}

export async function savePlayerAction(formData: FormData): Promise<void> {
  const scout = await getScout();
  if (!scout) return;
  const playerId = str(formData, 'playerId');
  if (!playerId) return;

  const existing = await prisma.savedPlayer.findUnique({
    where: { scoutId_playerId: { scoutId: scout.id, playerId } },
  });
  if (existing) {
    await prisma.savedPlayer.delete({ where: { id: existing.id } });
  } else {
    await prisma.savedPlayer.create({ data: { scoutId: scout.id, playerId } });
  }
  redirect('/dashboard/scout/players');
}
