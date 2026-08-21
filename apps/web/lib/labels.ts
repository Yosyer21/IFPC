/** Etiquetas compartidas de dominio (no exportar constantes desde archivos `page.tsx`). */

export const SESSION_TYPE_LABELS: Record<string, string> = {
  TRAINING: 'Entrenamiento',
  LECTURE: 'Charla',
  Q_AND_A: 'Preguntas y respuestas',
  TRIAL: 'Prueba',
};

export const LIVE_SESSION_TYPE_LABELS: Record<string, string> = SESSION_TYPE_LABELS;

export const LIVE_SESSION_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Programada',
  LIVE: 'En directo',
  ENDED: 'Finalizada',
  CANCELLED: 'Cancelada',
};

export const CAMP_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  OPEN: 'Abierto',
  FULL: 'Completo',
  CANCELLED: 'Cancelado',
  FINISHED: 'Finalizado',
};
