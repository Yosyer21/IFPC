const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? 'IFPC <no-reply@ifpc.com>';

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
  const text = `Recover your IFPC password\n
Open this link to choose a new password (valid for 1 hour):
${resetUrl}

If you did not request this change, you can ignore this email and your password will remain unchanged.`;

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#0a0e0c;padding:24px;font-family:Arial,sans-serif">
    <div style="max-width:480px;margin:0 auto;background:#111814;border:1px solid #2a332d;border-radius:16px;padding:32px">
      <div style="font-size:18px;font-weight:700;color:#34d399">IFPC</div>
      <h1 style="color:#ffffff;font-size:22px;margin:20px 0 8px">Recover your password</h1>
      <p style="color:#9ca3af;font-size:14px;line-height:1.6">
        We received a request to reset your password. The link is valid for
        <strong style="color:#e5e7eb">1 hour</strong>.
      </p>
      <p style="margin:24px 0">
        <a href="${resetUrl}"
           style="display:inline-block;background:#34d399;color:#022c22;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:10px">
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
  return sendEmail({ to, subject: 'Recover your password — IFPC', html, text });
}

function verificationTemplate(verifyUrl: string): { html: string; text: string } {
  const text = `Confirm your IFPC email
\nOpen this link to verify your email address (valid for 24 hours):
${verifyUrl}

If you did not create an IFPC account, ignore this email.`;

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#0a0e0c;padding:24px;font-family:Arial,sans-serif">
    <div style="max-width:480px;margin:0 auto;background:#111814;border:1px solid #2a332d;border-radius:16px;padding:32px">
      <div style="font-size:18px;font-weight:700;color:#34d399">IFPC</div>
      <h1 style="color:#ffffff;font-size:22px;margin:20px 0 8px">Confirm your email</h1>
      <p style="color:#9ca3af;font-size:14px;line-height:1.6">
        Thank you for creating your account. Verify your email address to unlock all the
        platform features. The link is valid for
        <strong style="color:#e5e7eb">24 hours</strong>.
      </p>
      <p style="margin:24px 0">
        <a href="${verifyUrl}"
           style="display:inline-block;background:#34d399;color:#022c22;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:10px">
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
  return sendEmail({ to, subject: 'Confirm your email — IFPC', html, text });
}
