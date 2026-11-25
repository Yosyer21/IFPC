import { prisma } from '@ifpc/database';
import { notifyUser } from '../../apps/web/lib/notifications/notify';
import {
  DOCUMENT_FOLDER_LABELS,
  documentExpiryStatus,
  isDocumentFolder,
} from '../../apps/web/lib/documents';

/**
 * Recordatorios de documentos por vencer (30 días por defecto) y ya vencidos
 * (hasta 14 días después). Crea un aviso de tipo `document` en la bandeja una
 * sola vez al día por documento, respetando las preferencias del jugador.
 *
 * Uso:
 *   pnpm scripts:document-reminders                  informe, no crea avisos
 *   pnpm scripts:document-reminders -- --apply       crea los avisos
 *   pnpm scripts:document-reminders -- --days 45     ventana de antelación
 *   pnpm scripts:document-reminders -- --user a@b.c  fuerza un destinatario
 *
 * Con PGlite hay que parar `pnpm dev` antes de lanzarlo: la base embebida no
 * admite dos procesos a la vez.
 */
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const days = Number(args[args.indexOf('--days') + 1] ?? 30) || 30;
const onlyUser = args.includes('--user') ? args[args.indexOf('--user') + 1] : undefined;

/** Cuántos días se sigue recordando un documento ya vencido. */
const EXPIRED_GRACE_DAYS = 14;
const DOCUMENTS_PATH = '/dashboard/player/documents';

async function main() {
  const now = new Date();
  const deadline = new Date(now.getTime() + days * 86_400_000);
  const floor = new Date(now.getTime() - EXPIRED_GRACE_DAYS * 86_400_000);
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const documents = await prisma.document.findMany({
    where: {
      expiresAt: { not: null, gte: floor, lte: deadline },
      ...(onlyUser ? { player: { user: { email: onlyUser } } } : {}),
    },
    select: {
      id: true,
      title: true,
      expiresAt: true,
      folder: true,
      player: {
        select: { userId: true, user: { select: { email: true } } },
      },
    },
    orderBy: { expiresAt: 'asc' },
  });

  console.log(
    `Document reminders · ${days} days ahead · ${documents.length} document(s)${
      apply ? '' : ' (report only)'
    }\n`
  );

  let sent = 0;
  for (const document of documents) {
    const status = documentExpiryStatus(document.expiresAt, now, days);
    if (status.state !== 'expiring' && status.state !== 'expired') continue;

    const expired = status.state === 'expired';
    const title = expired
      ? `Document expired: ${document.title}`
      : `Document expiring soon: ${document.title}`;
    const folder = isDocumentFolder(document.folder)
      ? DOCUMENT_FOLDER_LABELS[document.folder]
      : 'Document';
    const message = expired
      ? `Your ${folder.toLowerCase()} expired ${Math.abs(status.days ?? 0)} day(s) ago. Upload a replacement.`
      : `Your ${folder.toLowerCase()} expires in ${status.days} day(s). Upload a replacement before it expires.`;
    const email = document.player.user.email;

    if (!apply) {
      console.log(`· ${email} — ${title} (${status.days} d)`);
      continue;
    }

    const existing = await prisma.notification.findFirst({
      where: {
        userId: document.player.userId,
        type: 'document',
        title,
        createdAt: { gte: startOfDay },
      },
      select: { id: true },
    });
    if (existing) {
      console.log(`· ${email} — ${title} (already notified today)`);
      continue;
    }

    await notifyUser({
      userId: document.player.userId,
      type: 'document',
      title,
      message,
      link: DOCUMENTS_PATH,
    });
    sent += 1;
    console.log(`· ${email} — ${title} (notified)`);
  }

  console.log(
    apply
      ? `\nNotifications created: ${sent}`
      : '\nReport only. Add `--apply` to create the notifications.'
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
