/**
 * Email Action Service.
 *
 * Generates Firebase auth action links via the Admin SDK
 * (generateEmailVerificationLink / generatePasswordResetLink) instead of the
 * client `sendEmailVerification` flow, and hands the resulting message to a
 * provider-agnostic email provider for delivery.
 *
 * Delivery is a no-op until a real provider is configured (see ./providers).
 * The Firebase Console "custom action URL" (configured manually) makes the
 * generated links resolve to the branded /action page.
 */
import { getAdmin, isAdminInitialized } from '../../firebase.js';
import { loadConfig } from '../../infra/config.js';
import { logger } from '../../infra/logger.js';
import { getEmailProvider, type EmailMessage, type EmailProvider } from './providers.js';

export type EmailActionKind = 'verifyEmail' | 'resetPassword';

export interface SendResult {
  /** Whether the message was actually delivered by a provider. */
  sent: boolean;
  /** Provider used (e.g. "none", "resend"). */
  provider: string;
  /** Generated action link. Only exposed to callers in non-production. */
  link?: string;
}

function actionCodeSettings(): { url: string; handleCodeInApp: boolean } {
  const config = loadConfig();
  // Continue URL the user lands on AFTER completing the action. The action
  // page itself is governed by the Console custom action handler.
  return { url: `${config.appUrl}/login`, handleCodeInApp: false };
}

export class EmailActionService {
  constructor(private readonly provider: EmailProvider) {}

  /** Generate a Firebase email-verification link for the given address. */
  async generateVerificationLink(email: string): Promise<string> {
    if (!isAdminInitialized()) {
      throw new Error('Firebase Admin is not initialized; cannot generate links.');
    }
    return getAdmin().auth().generateEmailVerificationLink(email, actionCodeSettings());
  }

  /** Generate a Firebase password-reset link for the given address. */
  async generatePasswordResetLink(email: string): Promise<string> {
    if (!isAdminInitialized()) {
      throw new Error('Firebase Admin is not initialized; cannot generate links.');
    }
    return getAdmin().auth().generatePasswordResetLink(email, actionCodeSettings());
  }

  /** Build the message for an action. Templating lives here so providers stay dumb. */
  private buildMessage(kind: EmailActionKind, email: string, link: string): EmailMessage {
    if (kind === 'verifyEmail') {
      return {
        to: email,
        subject: 'Verify your Derivo email',
        text: `Confirm your email to finish setting up Derivo: ${link}`,
        html: `<p>Confirm your email to finish setting up Derivo.</p><p><a href="${link}">Verify email</a></p>`,
      };
    }
    return {
      to: email,
      subject: 'Reset your Derivo password',
      text: `Reset your Derivo password: ${link}`,
      html: `<p>Reset your Derivo password.</p><p><a href="${link}">Reset password</a></p>`,
    };
  }

  /** Generate a link and hand it to the provider for delivery (no-op today). */
  async send(kind: EmailActionKind, email: string): Promise<SendResult> {
    const link =
      kind === 'verifyEmail'
        ? await this.generateVerificationLink(email)
        : await this.generatePasswordResetLink(email);

    const message = this.buildMessage(kind, email, link);
    let sent = false;
    try {
      if (this.provider.canSend) {
        await this.provider.send(message);
        sent = true;
      } else {
        // Records intent without delivering — keeps the flow non-breaking.
        await this.provider.send(message);
      }
    } catch (err) {
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

/** Process-wide service using the configured provider. */
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
