/**
 * Reusable HTML email templates for every Derivo auth action.
 *
 * Design decisions:
 *   - White card on a light-grey background — renders well in Gmail, Outlook,
 *     Apple Mail, and dark-mode clients.
 *   - Inline styles only — email clients strip <style> blocks.
 *   - Table-based layout for maximum client compatibility.
 *   - Plain-text fallback required by email standards; included for every template.
 *   - CTA button has a visible fallback URL below it.
 *   - No external fonts, no tracking pixels, no external images.
 */

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  pageBg: '#f4f4f5',
  cardBg: '#ffffff',
  cardBorder: '#e4e4e7',
  cardRadius: '16px',
  textPrimary: '#09090b',
  textMuted: '#71717a',
  textFaint: '#a1a1aa',
  ctaBg: '#09090b',
  ctaText: '#ffffff',
  ctaRadius: '10px',
  divider: '#e4e4e7',
  fontStack: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
  year: String(new Date().getFullYear()),
};

// ── Shared layout ─────────────────────────────────────────────────────────────

function shell(content: string): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>Derivo</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings>
    <o:PixelsPerInch>96</o:PixelsPerInch>
  </o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${T.pageBg};font-family:${T.fontStack};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <!--[if mso | IE]><table role="none" width="100%" style="background-color:${T.pageBg};"><tr><td><![endif]-->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background-color:${T.pageBg};min-width:100%;">
    <tr>
      <td align="center" style="padding:48px 16px 40px;">

        <!--[if mso | IE]><table role="none" width="520"><tr><td><![endif]-->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:520px;">

          <!-- Wordmark -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <span style="font-family:${T.fontStack};font-size:17px;font-weight:700;
                           color:${T.textPrimary};letter-spacing:-0.3px;">Derivo</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:${T.cardBg};border:1px solid ${T.cardBorder};
                       border-radius:${T.cardRadius};overflow:hidden;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:36px 40px 32px;">
                    ${content}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0 0 6px;font-family:${T.fontStack};font-size:11px;
                        color:${T.textFaint};line-height:1.7;">
                This email was sent to you because this address is linked to a Derivo account.<br/>
                If you didn't request this, you can safely ignore it.
              </p>
              <p style="margin:0;font-family:${T.fontStack};font-size:11px;color:${T.textFaint};">
                &copy; ${T.year} Derivo &nbsp;&bull;&nbsp;
                <a href="mailto:support@derivo.in"
                   style="color:${T.textFaint};text-decoration:underline;">support@derivo.in</a>
              </p>
            </td>
          </tr>

        </table>
        <!--[if mso | IE]></td></tr></table><![endif]-->

      </td>
    </tr>
  </table>
  <!--[if mso | IE]></td></tr></table><![endif]-->
</body>
</html>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 8px;font-family:${T.fontStack};font-size:20px;font-weight:700;
                      color:${T.textPrimary};letter-spacing:-0.3px;line-height:1.3;">${text}</h1>`;
}

function body(text: string): string {
  return `<p style="margin:0;font-family:${T.fontStack};font-size:14px;color:${T.textMuted};
                    line-height:1.65;">${text}</p>`;
}

function cta(label: string, url: string): string {
  return `
  <!-- CTA button -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="margin:28px 0 0;">
    <tr>
      <td align="center">
        <!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          href="${url}" style="height:42px;v-text-anchor:middle;width:190px;" arcsize="24%"
          fillcolor="${T.ctaBg}" strokecolor="${T.ctaBg}">
          <w:anchorlock/>
          <center style="color:${T.ctaText};font-family:${T.fontStack};font-size:14px;font-weight:600;">
            ${label}
          </center>
        </v:roundrect>
        <![endif]-->
        <!--[if !mso]><!-->
        <a href="${url}" target="_blank" rel="noopener noreferrer"
           style="display:inline-block;background-color:${T.ctaBg};color:${T.ctaText};
                  font-family:${T.fontStack};font-size:14px;font-weight:600;
                  text-decoration:none;padding:12px 32px;border-radius:${T.ctaRadius};
                  letter-spacing:0.1px;line-height:1;">
          ${label}
        </a>
        <!--<![endif]-->
      </td>
    </tr>
    <!-- Fallback URL -->
    <tr>
      <td align="center" style="padding-top:16px;">
        <p style="margin:0;font-family:${T.fontStack};font-size:11px;color:${T.textFaint};">
          Or paste this link in your browser:
        </p>
        <p style="margin:4px 0 0;font-family:${T.fontStack};font-size:11px;
                  color:${T.textFaint};word-break:break-all;">
          <a href="${url}" style="color:${T.textFaint};text-decoration:underline;">${url}</a>
        </p>
      </td>
    </tr>
  </table>`;
}

function divider(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="margin:24px 0 0;">
    <tr>
      <td style="height:1px;background-color:${T.divider};font-size:0;line-height:0;">&nbsp;</td>
    </tr>
  </table>`;
}

function securityNote(expiresIn: string): string {
  return `
  ${divider()}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="margin-top:16px;">
    <tr>
      <td>
        <p style="margin:0;font-family:${T.fontStack};font-size:11px;
                  color:${T.textFaint};line-height:1.7;">
          &#x1F512;&nbsp; This link expires in
          <strong style="color:${T.textMuted};">${expiresIn}</strong>
          and can only be used once.<br/>
          If you didn't request this, no action is needed.
        </p>
      </td>
    </tr>
  </table>`;
}

// ── Public templates ──────────────────────────────────────────────────────────

export function verifyEmailTemplate(link: string): EmailTemplate {
  const html = shell(`
    ${heading('Verify your email')}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="margin-top:8px;">
      <tr><td>
        ${body('Welcome to Derivo. Click the button below to verify your email address and activate your account.')}
      </td></tr>
    </table>
    ${cta('Verify Email', link)}
    ${securityNote('24 hours')}
  `);

  const text = [
    'Verify your Derivo email',
    '',
    'Welcome to Derivo. Click the link below to verify your email address:',
    '',
    link,
    '',
    'This link expires in 24 hours and can only be used once.',
    "If you didn't create a Derivo account you can safely ignore this email.",
    '',
    '— Derivo  support@derivo.in',
  ].join('\n');

  return {
    subject: 'Verify your email — Derivo',
    html,
    text,
  };
}

export function passwordResetTemplate(link: string): EmailTemplate {
  const html = shell(`
    ${heading('Reset your password')}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="margin-top:8px;">
      <tr><td>
        ${body('We received a request to reset the password for your Derivo account. Click the button below to choose a new password.')}
      </td></tr>
    </table>
    ${cta('Reset Password', link)}
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
    "If you didn't request a password reset you can safely ignore this email.",
    '',
    '— Derivo  support@derivo.in',
  ].join('\n');

  return {
    subject: 'Reset your password — Derivo',
    html,
    text,
  };
}

export function recoverEmailTemplate(link: string, restoredEmail: string): EmailTemplate {
  const safeEmail = restoredEmail.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const html = shell(`
    ${heading('Recover your email address')}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="margin-top:8px;">
      <tr><td>
        ${body(`A request was made to change the email address on your Derivo account.
          If you want to reverse this and restore
          <strong style="color:${T.textPrimary};">${safeEmail}</strong>,
          click the button below.`)}
      </td></tr>
    </table>
    ${cta('Recover Email Address', link)}
    ${securityNote('24 hours')}
  `);

  const text = [
    'Recover your Derivo email address',
    '',
    `A request was made to change your account email. To restore ${restoredEmail}:`,
    '',
    link,
    '',
    'This link expires in 24 hours and can only be used once.',
    'If you made this change yourself you can ignore this email.',
    '',
    '— Derivo  support@derivo.in',
  ].join('\n');

  return {
    subject: 'Recover your email address — Derivo',
    html,
    text,
  };
}
