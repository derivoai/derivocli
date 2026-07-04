/**
 * Email Action Service — the single source of truth for every Firebase auth
 * email (verify, reset, recover).
 *
 * Links are generated via the Firebase Admin SDK so they point DIRECTLY to
 * https://auth.derivo.in/action (our branded page). Firebase's "Customize
 * Action URL" console setting is NOT needed and NOT used.
 *
 * How link generation works:
 *  - generateEmailVerificationLink(email, { url: continueUrl }) builds:
 *      https://auth.derivo.in/action?mode=verifyEmail&oobCode=...&continueUrl=...
 *    The key is that we supply authActionUrl as the first argument to
 *    ActionCodeSettings.url — this IS the action page, not just a continueUrl.
 *    To make Admin SDK generate the correct shape, we set the Firebase project's
 *    action URL via the continueUrl trick below.
 *
 * Note on Admin SDK behavior:
 *  The Admin SDK always prepends the project's configured action URL and appends
 *  continueUrl. To override the action URL we use the workaround:
 *    - Pass actionCodeSettings.url = our action page
 *  This results in the link being:
 *    https://auth.derivo.in/action?mode=verifyEmail&oobCode=...&continueUrl=<appUrl>/login&apiKey=...
 *  Which is exactly what our /action page expects.
 *
 * Delivery is a no-op until a real provider is configured. Flows never throw on
 * send failure — they log + move on. Links are never returned to clients in prod.
 */
import { getAdmin, isAdminInitialized } from '../../firebase.js';
import { loadConfig } from '../../infra/config.js';
import { logger } from '../../infra/logger.js';
import { getEmailProvider, type EmailProvider, type EmailAttachment } from './providers.js';
import { verifyEmailTemplate, passwordResetTemplate, recoverEmailTemplate } from './templates.js';
import { LOGO_BASE64, LOGO_CONTENT_ID, LOGO_CONTENT_TYPE, LOGO_FILENAME } from './logo.js';

/**
 * Inline logo attached to every auth email. Referenced from the HTML header
 * via `cid:${LOGO_CONTENT_ID}` (see templates.ts).
 */
const LOGO_ATTACHMENT: EmailAttachment = {
  content: LOGO_BASE64,
  filename: LOGO_FILENAME,
  contentType: LOGO_CONTENT_TYPE,
  contentId: LOGO_CONTENT_ID,
};

export type EmailActionKind = 'verifyEmail' | 'resetPassword' | 'recoverEmail';

export interface SendResult {
  /** Whether the message was actually handed to a sending provider. */
  sent: boolean;
  /** Provider name (e.g. "none", "resend"). */
  provider: string;
  /**
   * Generated action link. Returned only in non-production so callers can
   * test the flow without an email provider. Never returned in production.
   */
  link?: string;
}

/**
 * Build ActionCodeSettings that direct every Firebase action link to the
 * branded /action page. The Admin SDK appends `continueUrl` as a query param;
 * we supply the post-action destination (login page) as the continueUrl while
 * our authActionUrl becomes the host the oobCode is validated against.
 *
 * Firebase Admin docs: the `url` field in ActionCodeSettings IS the continue
 * URL (appended as ?continueUrl=...). The base of the link always comes from
 * the project's auth domain / configured action URL setting in the console.
 *
 * Since we cannot set the console action URL, we use a direct link rewrite:
 * the Admin SDK generateEmailVerificationLink output is:
 *   https://<authDomain>/__/auth/action?mode=...&oobCode=...&continueUrl=...
 * We then replace the base path to point to our page instead (see rewriteLink).
 */
function continueUrl(): string {
  return `${loadConfig().appUrl}/login`;
}

/**
 * Take a Firebase-generated action link and rewrite its base to our branded
 * action page (https://auth.derivo.in/action), preserving all query params.
 * This is the mechanism that replaces the Firebase Console "Action URL" setting
 * without requiring any console configuration.
 */
function rewriteLink(firebaseLink: string): string {
  const authActionUrl = loadConfig().authActionUrl;
  try {
    const url = new URL(firebaseLink);
    const target = new URL(authActionUrl);
    // Copy all query params from the Firebase link to our action URL.
    url.searchParams.forEach((value, key) => {
      target.searchParams.set(key, value);
    });
    return target.toString();
  } catch {
    // Fallback: return the original link if URL parsing fails.
    logger.warn('link rewrite failed, using original firebase link');
    return firebaseLink;
  }
}

export class EmailActionService {
  constructor(private readonly provider: EmailProvider) {}

  /** Generate + rewrite a verify-email action link. */
  async generateVerificationLink(email: string): Promise<string> {
    if (!isAdminInitialized()) {
      throw new Error('Firebase Admin is not initialized; cannot generate links.');
    }
    const raw = await getAdmin()
      .auth()
      .generateEmailVerificationLink(email, { url: continueUrl() });
    return rewriteLink(raw);
  }

  /** Generate + rewrite a password-reset action link. */
  async generatePasswordResetLink(email: string): Promise<string> {
    if (!isAdminInitialized()) {
      throw new Error('Firebase Admin is not initialized; cannot generate links.');
    }
    const raw = await getAdmin().auth().generatePasswordResetLink(email, { url: continueUrl() });
    return rewriteLink(raw);
  }

  /** Generate + rewrite an email-sign-in / recovery link. */
  async generateEmailSignInLink(email: string): Promise<string> {
    if (!isAdminInitialized()) {
      throw new Error('Firebase Admin is not initialized; cannot generate links.');
    }
    const raw = await getAdmin()
      .auth()
      .generateEmailVerificationLink(email, { url: continueUrl() });
    return rewriteLink(raw);
  }

  /**
   * Generate and send a verification email.
   * Uses the HTML/text template from templates.ts.
   */
  async sendVerification(email: string): Promise<SendResult> {
    return this._send('verifyEmail', email);
  }

  /**
   * Generate and send a password-reset email.
   */
  async sendPasswordReset(email: string): Promise<SendResult> {
    return this._send('resetPassword', email);
  }

  /**
   * Generate and send a recover-email email.
   * `restoredEmail` is the address that will be recovered (shown in the copy).
   */
  async sendRecoverEmail(email: string, restoredEmail: string): Promise<SendResult> {
    return this._send('recoverEmail', email, { restoredEmail });
  }

  /**
   * Convenience unified send — kept for backward compatibility with existing
   * route callers that use `service.send(kind, email)`.
   */
  async send(
    kind: EmailActionKind,
    email: string,
    opts?: { restoredEmail?: string },
  ): Promise<SendResult> {
    return this._send(kind, email, opts);
  }

  private async _send(
    kind: EmailActionKind,
    email: string,
    opts: { restoredEmail?: string } = {},
  ): Promise<SendResult> {
    let link: string;
    try {
      if (kind === 'verifyEmail') {
        link = await this.generateVerificationLink(email);
      } else if (kind === 'resetPassword') {
        link = await this.generatePasswordResetLink(email);
      } else {
        // recoverEmail: Firebase does not have a dedicated Admin SDK method for
        // recovery links. The oobCode for recovery is delivered by Firebase's own
        // system when a user changes their email — we cannot generate it server-side.
        // For completeness the service accepts this kind; callers that DO have a
        // raw oobCode can construct the link manually using authActionUrl.
        logger.warn(
          'recoverEmail send requested — no Admin SDK method available; skipping link generation',
          { email },
        );
        const config = loadConfig();
        link = `${config.authActionUrl}?mode=recoverEmail`;
      }
    } catch (err) {
      logger.error('link generation failed', {
        kind,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }

    const template =
      kind === 'verifyEmail'
        ? verifyEmailTemplate(link)
        : kind === 'resetPassword'
          ? passwordResetTemplate(link)
          : recoverEmailTemplate(link, opts.restoredEmail ?? email);

    let sent = false;
    try {
      await this.provider.send({ to: email, ...template, attachments: [LOGO_ATTACHMENT] });
      sent = this.provider.canSend;
    } catch (err) {
      // Never let a provider failure break the caller — log and move on.
      logger.error('email provider send failed', {
        provider: this.provider.name,
        kind,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    const result: SendResult = { sent, provider: this.provider.name };
    // Never leak action links in production responses.
    if (loadConfig().env !== 'production') result.link = link;
    return result;
  }
}

let instance: EmailActionService | null = null;

/** Process-wide singleton using the configured provider. */
export function getEmailActionService(): EmailActionService {
  if (instance) return instance;
  const provider = getEmailProvider(loadConfig().emailProvider);
  instance = new EmailActionService(provider);
  return instance;
}

/** Tests: reset the cached service. */
export function resetEmailActionServiceForTesting(): void {
  instance = null;
}
