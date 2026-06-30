/**
 * Reusable HTML email templates.
 *
 * These produce responsive, dark-mode-friendly HTML that is provider-agnostic.
 * The actual sending (Resend / Postmark / SendGrid) is wired separately — these
 * functions only return { subject, html, text } payloads ready to hand off.
 *
 * Constraints:
 *  - Inline styles only (email clients strip <style> blocks).
 *  - No external fonts or image URLs beyond the logo placeholder.
 *  - Plain-text fallback included for every template.
 *  - CTA buttons are a single <a> with a visible fallback URL.
 */

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// ── Shared design tokens (inline) ────────────────────────────────────────────
const T = {
  bg: '#0a0a0a',
  cardBg: '#111111',
  cardBorder: '#222222',
  text: '#e5e5e5',
  textMuted: '#888888',
  textFaint: '#555555',
  accent: '#ffffff',
  accentText: '#000000',
  errorBg: '#1a0a0a',
  successBg: '#0a1a0f',
  fontStack: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
};

function base(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${T.bg};font-family:${T.fontStack};color:${T.text};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${T.bg};padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <span style="font-size:18px;font-weight:700;letter-spacing:-0.3px;color:${T.accent};font-family:${T.fontStack};">Derivo</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:${T.cardBg};border:1px solid ${T.cardBorder};border-radius:16px;padding:36px 36px 32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-size:11px;color:${T.textFaint};line-height:1.6;">
                You received this email because this address is associated with a Derivo account.<br/>
                If this wasn't you, you can ignore this email safely.<br/><br/>
                &copy; ${new Date().getFullYear()} Derivo &mdash;
                <a href="mailto:support@derivo.in" style="color:${T.textFaint};text-decoration:underline;">support@derivo.in</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(label: string, url: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
      <tr>
        <td align="center">
          <a href="${url}"
             target="_blank"
             rel="noopener noreferrer"
             style="display:inline-block;background-color:${T.accent};color:${T.accentText};font-family:${T.fontStack};font-size:13px;font-weight:600;text-decoration:none;padding:11px 28px;border-radius:10px;letter-spacing:0.1px;">
            ${label}
          </a>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-top:14px;">
          <p style="margin:0;font-size:11px;color:${T.textFaint};">
            Or copy this link into your browser:<br/>
            <a href="${url}" style="color:${T.textFaint};word-break:break-all;">${url}</a>
          </p>
        </td>
      </tr>
    </table>`;
}

function securityNote(expiresIn: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;border-top:1px solid ${T.cardBorder};">
      <tr>
        <td style="padding-top:18px;">
          <p style="margin:0;font-size:11px;color:${T.textFaint};line-height:1.6;">
            &#x1F512;&nbsp; This link expires in <strong style="color:${T.textMuted};">${expiresIn}</strong> and can only be used once.<br/>
            If you didn't request this, you can safely ignore this email.
          </p>
        </td>
      </tr>
    </table>`;
}

// ── Templates ─────────────────────────────────────────────────────────────────

export function verifyEmailTemplate(link: string): EmailTemplate {
  const html = base(`
    <h1 style="margin:0 0 6px;font-size:18px;font-weight:700;color:${T.accent};letter-spacing:-0.2px;">
      Verify your email
    </h1>
    <p style="margin:0 0 4px;font-size:13px;color:${T.textMuted};line-height:1.6;">
      Thanks for signing up for Derivo. Click the button below to confirm your email address
      and activate your account.
    </p>
    ${ctaButton('Verify email address', link)}
    ${securityNote('24 hours')}
  `);

  const text = [
    'Verify your Derivo email',
    '',
    'Thanks for signing up. Confirm your email address to activate your account:',
    '',
    link,
    '',
    'This link expires in 24 hours and can only be used once.',
    "If you didn't sign up for Derivo, you can ignore this email.",
    '',
    '— Derivo (support@derivo.in)',
  ].join('\n');

  return { subject: 'Verify your Derivo email address', html, text };
}

export function passwordResetTemplate(link: string): EmailTemplate {
  const html = base(`
    <h1 style="margin:0 0 6px;font-size:18px;font-weight:700;color:${T.accent};letter-spacing:-0.2px;">
      Reset your password
    </h1>
    <p style="margin:0 0 4px;font-size:13px;color:${T.textMuted};line-height:1.6;">
      We received a request to reset the password for your Derivo account.
      Click the button below to choose a new password.
    </p>
    ${ctaButton('Reset password', link)}
    ${securityNote('1 hour')}
  `);

  const text = [
    'Reset your Derivo password',
    '',
    'We received a request to reset your password. Use the link below:',
    '',
    link,
    '',
    'This link expires in 1 hour and can only be used once.',
    "If you didn't request a password reset, you can ignore this email.",
    '',
    '— Derivo (support@derivo.in)',
  ].join('\n');

  return { subject: 'Reset your Derivo password', html, text };
}

export function recoverEmailTemplate(link: string, restoredEmail: string): EmailTemplate {
  const html = base(`
    <h1 style="margin:0 0 6px;font-size:18px;font-weight:700;color:${T.accent};letter-spacing:-0.2px;">
      Recover your email address
    </h1>
    <p style="margin:0 0 4px;font-size:13px;color:${T.textMuted};line-height:1.6;">
      A request was made to change your Derivo account email. If you want to reverse this and
      restore access to&nbsp;<strong style="color:${T.text};">${restoredEmail}</strong>,
      click the button below.
    </p>
    ${ctaButton('Recover email address', link)}
    ${securityNote('24 hours')}
  `);

  const text = [
    'Recover your Derivo email address',
    '',
    `A request was made to change your account email. To restore ${restoredEmail}:`,
    '',
    link,
    '',
    'This link expires in 24 hours.',
    'If you initiated the email change yourself, you can ignore this.',
    '',
    '— Derivo (support@derivo.in)',
  ].join('\n');

  return { subject: 'Recover your Derivo account email', html, text };
}
