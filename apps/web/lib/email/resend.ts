const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? 'Future Buller <no-reply@futurebuller.com>';

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
 * Envía un email usando la API REST de Resend (sin dependencia npm).
 * Sin `RESEND_API_KEY` válida registra el contenido en consola (modo desarrollo).
 */
export async function sendEmail(message: EmailMessage): Promise<SendEmailResult> {
  const configured = Boolean(RESEND_API_KEY) && RESEND_API_KEY !== 're_cambiar';
  if (!configured) {
    console.log(`[email] → ${message.to} · ${message.subject}`);
    console.log(`[email] ${message.text ?? ''}`);
    return { ok: false, error: 'Resend no configurado' };
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
      console.error('[email] error de Resend:', detail);
      return { ok: false, error: `Resend HTTP ${response.status}` };
    }
    const data = (await response.json()) as { id?: string };
    return { ok: true, id: data.id };
  } catch (error) {
    console.error('[email] no se pudo enviar:', error);
    return { ok: false, error: 'Fallo de red al enviar el email' };
  }
}

function resetPasswordTemplate(resetUrl: string): { html: string; text: string } {
  const text = `Recupera tu contraseña de Future Buller

Abre este enlace para elegir una nueva contraseña (válido durante 1 hora):
${resetUrl}

Si no has solicitado este cambio, puedes ignorar este email y tu contraseña seguirá igual.`;

  const html = `<!doctype html>
<html lang="es">
  <body style="margin:0;background:#0a0e0c;padding:24px;font-family:Arial,sans-serif">
    <div style="max-width:480px;margin:0 auto;background:#111814;border:1px solid #2a332d;border-radius:16px;padding:32px">
      <div style="font-size:18px;font-weight:700;color:#34d399">Future Buller</div>
      <h1 style="color:#ffffff;font-size:22px;margin:20px 0 8px">Recupera tu contraseña</h1>
      <p style="color:#9ca3af;font-size:14px;line-height:1.6">
        Recibimos una solicitud para restablecer tu contraseña. El enlace es válido durante
        <strong style="color:#e5e7eb">1 hora</strong>.
      </p>
      <p style="margin:24px 0">
        <a href="${resetUrl}"
           style="display:inline-block;background:#34d399;color:#022c22;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:10px">
          Restablecer contraseña
        </a>
      </p>
      <p style="color:#6b7280;font-size:12px;line-height:1.6">
        Si el botón no funciona, copia y pega este enlace en tu navegador:<br/>
        <span style="color:#9ca3af;word-break:break-all">${resetUrl}</span>
      </p>
      <p style="color:#6b7280;font-size:12px;margin-top:24px">
        Si no has solicitado este cambio, ignora este email.
      </p>
    </div>
  </body>
</html>`;

  return { html, text };
}

/** Email de recuperación de contraseña. */
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<SendEmailResult> {
  const { html, text } = resetPasswordTemplate(resetUrl);
  return sendEmail({ to, subject: 'Recupera tu contraseña — Future Buller', html, text });
}
