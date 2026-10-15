import type { Digest } from '../notifications/digest';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'Future Baller <no-reply@futureballer.com>';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
}

/**
 * Sends an email using the Resend REST API (no npm dependency).
 * Without a valid `RESEND_API_KEY` it logs the content to the console (dev mode).
 */
export async function sendEmail(message: EmailMessage): Promise<SendEmailResult> {
  const configured = Boolean(RESEND_API_KEY) && RESEND_API_KEY !== 're_cambiar';
  if (!configured) {
    console.log(`[email] → ${message.to} · ${message.subject}`);
    console.log(`[email] ${message.text ?? ''}`);
    return { ok: false, error: 'Resend not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });
    if (!response.ok) {
      const detail = await response.text();
      console.error('[email] Resend error:', detail);
      return { ok: false, error: `Resend HTTP ${response.status}` };
    }
    const data = (await response.json()) as { id?: string };
    return { ok: true, id: data.id };
  } catch (error) {
    console.error('[email] failed to send:', error);
    return { ok: false, error: 'Network failure sending the email' };
  }
}

function resetPasswordTemplate(resetUrl: string): { html: string; text: string } {
  const text = `Recover your Future Baller password\n
Open this link to choose a new password (valid for 1 hour):
${resetUrl}

If you did not request this change, you can ignore this email and your password will remain unchanged.`;

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#0C0F13;padding:24px;font-family:Arial,sans-serif">
    <div style="max-width:480px;margin:0 auto;background:#12161B;border:1px solid #242A33;border-radius:16px;padding:32px">
      <div style="font-size:18px;font-weight:700;color:#C4F747">Future Baller</div>
      <h1 style="color:#ffffff;font-size:22px;margin:20px 0 8px">Recover your password</h1>
      <p style="color:#9ca3af;font-size:14px;line-height:1.6">
        We received a request to reset your password. The link is valid for
        <strong style="color:#F4F5F2">1 hour</strong>.
      </p>
      <p style="margin:24px 0">
        <a href="${resetUrl}"
           style="display:inline-block;background:#C4F747;color:#11151A;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:10px">
          Reset password
        </a>
      </p>
      <p style="color:#6b7280;font-size:12px;line-height:1.6">
        If the button does not work, copy and paste this link into your browser:<br/>
        <span style="color:#9ca3af;word-break:break-all">${resetUrl}</span>
      </p>
      <p style="color:#6b7280;font-size:12px;margin-top:24px">
        If you did not request this change, ignore this email.
      </p>
    </div>
  </body>
</html>`;

  return { html, text };
}

/** Password recovery email. */
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<SendEmailResult> {
  const { html, text } = resetPasswordTemplate(resetUrl);
  return sendEmail({ to, subject: 'Recover your password — Future Baller', html, text });
}

function verificationTemplate(verifyUrl: string): { html: string; text: string } {
  const text = `Confirm your Future Baller email
\nOpen this link to verify your email address (valid for 24 hours):
${verifyUrl}

If you did not create an Future Baller account, ignore this email.`;

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#0C0F13;padding:24px;font-family:Arial,sans-serif">
    <div style="max-width:480px;margin:0 auto;background:#12161B;border:1px solid #242A33;border-radius:16px;padding:32px">
      <div style="font-size:18px;font-weight:700;color:#C4F747">Future Baller</div>
      <h1 style="color:#ffffff;font-size:22px;margin:20px 0 8px">Confirm your email</h1>
      <p style="color:#9ca3af;font-size:14px;line-height:1.6">
        Thank you for creating your account. Verify your email address to unlock all the
        platform features. The link is valid for
        <strong style="color:#F4F5F2">24 hours</strong>.
      </p>
      <p style="margin:24px 0">
        <a href="${verifyUrl}"
           style="display:inline-block;background:#C4F747;color:#11151A;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:10px">
          Verify email
        </a>
      </p>
      <p style="color:#6b7280;font-size:12px;line-height:1.6">
        If the button does not work, copy and paste this link into your browser:<br/>
        <span style="color:#9ca3af;word-break:break-all">${verifyUrl}</span>
      </p>
    </div>
  </body>
</html>`;

  return { html, text };
}

/** Account verification email. */
export async function sendVerificationEmail(
  to: string,
  verifyUrl: string
): Promise<SendEmailResult> {
  const { html, text } = verificationTemplate(verifyUrl);
  return sendEmail({ to, subject: 'Confirm your email — Future Baller', html, text });
}

/** Escapa el contenido que viene del usuario (nombres, títulos de posts…). */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface NotificationEmailInput {
  to: string;
  /** Nombre del destinatario (solo se usa el primer nombre). */
  name?: string;
  title: string;
  message?: string | null;
  /** Enlace **absoluto** al aviso dentro de la plataforma. */
  url?: string | null;
}

function notificationTemplate(input: Omit<NotificationEmailInput, 'to'>): {
  html: string;
  text: string;
} {
  const greeting = input.name ? `Hi ${input.name.trim().split(/\s+/)[0]},` : 'Hi,';
  const body = input.message ? `${greeting} ${input.message}` : greeting;

  const text = `${input.title}

${body}

${input.url ? `Open it here: ${input.url}` : 'Sign in to see it.'}

You get this email because you turned on email notifications. You can change it in
Settings → Notifications.`;

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#0C0F13;padding:24px;font-family:Arial,sans-serif">
    <div style="max-width:480px;margin:0 auto;background:#12161B;border:1px solid #242A33;border-radius:16px;padding:32px">
      <div style="font-size:18px;font-weight:700;color:#C4F747">Future Baller</div>
      <h1 style="color:#F4F5F2;font-size:22px;margin:20px 0 8px">${escapeHtml(input.title)}</h1>
      <p style="color:#9ca3af;font-size:14px;line-height:1.6">${escapeHtml(body)}</p>
      ${
        input.url
          ? `<p style="margin:24px 0">
        <a href="${input.url}"
           style="display:inline-block;background:#C4F747;color:#11151A;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:10px">
          Open in Future Baller
        </a>
      </p>`
          : ''
      }
      <p style="color:#6b7280;font-size:12px;line-height:1.6;margin-top:24px">
        You get this email because you turned on email notifications. You can change it in
        Settings → Notifications.
      </p>
    </div>
  </body>
</html>`;

  return { html, text };
}

/** Copia por email de un aviso de la plataforma (respeta las preferencias). */
export async function sendNotificationEmail(
  input: NotificationEmailInput
): Promise<SendEmailResult> {
  const { html, text } = notificationTemplate(input);
  return sendEmail({ to: input.to, subject: `${input.title} — Future Baller`, html, text });
}

export interface WeeklyDigestEmailInput {
  to: string;
  name?: string;
  /** Días que cubre el resumen (7 por defecto). */
  days: number;
  digest: Digest;
  /** Base absoluta de la plataforma (`NEXT_PUBLIC_APP_URL`). */
  appUrl: string;
  /** Ruta interna de la bandeja de avisos. */
  linkPath: string;
}

/** Listado de un grupo del resumen: etiqueta, contadores y títulos enlazados. */
function digestGroupHtml(group: Digest['groups'][number], appUrl: string): string {
  const items = group.items
    .map((item) => {
      const label = escapeHtml(item.title);
      const url = item.link ? `${appUrl}${item.link.startsWith('/') ? '' : '/'}${item.link}` : null;
      return `<li style="margin:4px 0;color:#9ca3af;font-size:13px;line-height:1.5">${
        url ? `<a href="${url}" style="color:#C4F747;text-decoration:none">${label}</a>` : label
      }</li>`;
    })
    .join('');

  return `<div style="margin:16px 0 0">
      <p style="margin:0;color:#F4F5F2;font-size:14px;font-weight:700">${escapeHtml(group.label)}
        <span style="color:#6b7280;font-weight:400">· ${group.total}${
          group.unread > 0 ? ` (${group.unread} unread)` : ''
        }</span>
      </p>
      ${items ? `<ul style="margin:6px 0 0;padding-left:18px">${items}</ul>` : ''}
    </div>`;
}

/**
 * Resumen semanal: lo que ha pasado en la plataforma durante los últimos días.
 * Solo se manda a quien lo tenga activado y con la dirección verificada.
 */
export async function sendWeeklyDigestEmail(
  input: WeeklyDigestEmailInput
): Promise<SendEmailResult> {
  const greeting = input.name ? `Hi ${input.name.trim().split(/\s+/)[0]},` : 'Hi,';
  const url = `${input.appUrl}${input.linkPath}`;

  const text = `${greeting}

Your ${input.days}-day summary on Future Baller: ${input.digest.total} notifications (${input.digest.unread} unread).

${input.digest.groups
  .map(
    (group) =>
      `· ${group.label}: ${group.total}${group.unread > 0 ? ` (${group.unread} unread)` : ''}`
  )
  .join('\n')}

Open them here: ${url}

You get this summary because you turned it on in Settings → Notifications.`;

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#0C0F13;padding:24px;font-family:Arial,sans-serif">
    <div style="max-width:480px;margin:0 auto;background:#12161B;border:1px solid #242A33;border-radius:16px;padding:32px">
      <div style="font-size:18px;font-weight:700;color:#C4F747">Future Baller</div>
      <h1 style="color:#F4F5F2;font-size:22px;margin:20px 0 8px">Your ${input.days}-day summary</h1>
      <p style="color:#9ca3af;font-size:14px;line-height:1.6">
        ${escapeHtml(greeting)} you have
        <strong style="color:#F4F5F2">${input.digest.total} notifications</strong>
        (${input.digest.unread} unread).
      </p>
      ${input.digest.groups.map((group) => digestGroupHtml(group, input.appUrl)).join('')}
      <p style="margin:24px 0">
        <a href="${url}"
           style="display:inline-block;background:#C4F747;color:#11151A;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:10px">
          Open my notifications
        </a>
      </p>
      <p style="color:#6b7280;font-size:12px;line-height:1.6;margin-top:24px">
        You get this summary because you turned it on in Settings → Notifications.
      </p>
    </div>
  </body>
</html>`;

  return sendEmail({ to: input.to, subject: 'Your week on Future Baller', html, text });
}
