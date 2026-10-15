import { prisma } from '@ifpc/database';
import {
  WEEKLY_DIGEST_CATEGORY,
  wantsWeeklyDigest,
} from '../../apps/web/lib/notifications/preferences';
import { buildDigest } from '../../apps/web/lib/notifications/digest';
import { sendWeeklyDigestEmail } from '../../apps/web/lib/email/resend';

/**
 * Resumen semanal por email: lo que ha pasado en la plataforma en los últimos
 * días. Solo se manda a quien lo tenga activado **y** con la dirección
 * verificada, y nunca con el resumen vacío.
 *
 * Uso:
 *   pnpm scripts:weekly-digest                      informe, no manda nada
 *   pnpm scripts:weekly-digest -- --apply           manda los correos
 *   pnpm scripts:weekly-digest -- --days 7          ventana en días
 *   pnpm scripts:weekly-digest -- --user a@b.com    fuerza un destinatario (pruebas)
 *
 * Sin `RESEND_API_KEY` los correos se quedan en la consola del servidor.
 * En producción va con cron una vez por semana (ver docs/technical/notifications.md).
 *
 * Con PGlite hay que parar `pnpm dev` antes de lanzarlo: la base embebida no
 * admite dos procesos a la vez.
 */
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const days = Number(args[args.indexOf('--days') + 1] ?? 7) || 7;
const onlyUser = args.includes('--user') ? args[args.indexOf('--user') + 1] : undefined;

/** Ruta interna de la bandeja, a la que apunta el botón del email. */
const INBOX_PATH = '/dashboard/player/notifications';

async function main() {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const userSelect = { id: true, email: true, name: true, emailVerified: true } as const;

  // Destinatarios: quien activó el resumen, o el que se fuerce por `--user`.
  const recipients = onlyUser
    ? await prisma.user.findMany({ where: { email: onlyUser }, select: userSelect })
    : (
        await prisma.notificationPreference.findMany({
          where: { category: WEEKLY_DIGEST_CATEGORY, email: true },
          select: { user: { select: userSelect } },
        })
      ).map((row) => row.user);

  console.log(
    `Resumen de ${days} días · destinatarios: ${recipients.length}${apply ? '' : ' (informe, sin enviar)'}\n`
  );

  for (const user of recipients) {
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      select: { type: true, title: true, message: true, link: true, read: true, createdAt: true },
    });
    const digest = buildDigest(notifications);

    if (digest.total === 0) {
      console.log(`· ${user.email}: sin novedades, no se manda nada`);
      continue;
    }

    const blocked = user.emailVerified ? null : 'el email no está verificado';

    if (!apply) {
      console.log(`· ${user.email}: ${digest.total} avisos (${digest.unread} sin leer)`);
      for (const group of digest.groups) {
        console.log(
          `    ${group.label}: ${group.total}${group.unread ? ` (${group.unread} sin leer)` : ''}`
        );
      }
      if (blocked) console.log(`    (no se enviaría: ${blocked})`);
      continue;
    }

    if (blocked) {
      console.log(`· ${user.email}: ${digest.total} avisos, pero ${blocked}`);
      continue;
    }

    const result = await sendWeeklyDigestEmail({
      to: user.email,
      name: user.name,
      days,
      digest,
      appUrl,
      linkPath: INBOX_PATH,
    });
    console.log(
      `· ${user.email}: ${digest.total} avisos → ${result.ok ? 'enviado' : 'a la consola (sin RESEND_API_KEY)'}`
    );
  }

  if (!apply) {
    console.log('\nInforme sin enviar. Añade `--apply` para mandar los correos.');
  }
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
