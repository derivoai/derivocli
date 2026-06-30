/**
 * Provider-agnostic email abstraction.
 *
 * IMPORTANT: email SENDING is intentionally NOT implemented yet. This file only
 * prepares the abstraction so a real provider (Resend / Postmark / SendGrid)
 * can be dropped in later without touching call sites. Until a provider is
 * configured, the no-op provider is used and messages are logged, not sent.
 */
import { logger } from '../../infra/logger.js';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface EmailProvider {
  readonly name: string;
  /** Whether this provider can actually deliver mail right now. */
  readonly canSend: boolean;
  send(message: EmailMessage): Promise<void>;
}

/**
 * No-op provider used until a real one is configured. It never throws and never
 * delivers — it records intent so flows that "send" email don't break.
 */
export class NoopEmailProvider implements EmailProvider {
  readonly name = 'none';
  readonly canSend = false;
  async send(message: EmailMessage): Promise<void> {
    logger.warn('email send skipped (no provider configured)', {
      to: message.to,
      subject: message.subject,
    });
  }
}

/** Placeholder for the future Resend integration. */
export class ResendEmailProvider implements EmailProvider {
  readonly name = 'resend';
  readonly canSend = false;
  async send(_message: EmailMessage): Promise<void> {
    throw new Error('Resend email provider is not implemented yet.');
  }
}

/** Placeholder for the future Postmark integration. */
export class PostmarkEmailProvider implements EmailProvider {
  readonly name = 'postmark';
  readonly canSend = false;
  async send(_message: EmailMessage): Promise<void> {
    throw new Error('Postmark email provider is not implemented yet.');
  }
}

/** Placeholder for the future SendGrid integration. */
export class SendGridEmailProvider implements EmailProvider {
  readonly name = 'sendgrid';
  readonly canSend = false;
  async send(_message: EmailMessage): Promise<void> {
    throw new Error('SendGrid email provider is not implemented yet.');
  }
}

let cached: EmailProvider | null = null;

/**
 * Resolve the configured email provider. Returns a concrete provider object so
 * the abstraction is exercised, but only the no-op provider can actually run
 * today (the others throw until implemented).
 */
export function getEmailProvider(name: string): EmailProvider {
  if (cached && cached.name === name) return cached;
  switch (name) {
    case 'resend':
      cached = new ResendEmailProvider();
      break;
    case 'postmark':
      cached = new PostmarkEmailProvider();
      break;
    case 'sendgrid':
      cached = new SendGridEmailProvider();
      break;
    default:
      cached = new NoopEmailProvider();
  }
  return cached;
}

/** Tests: drop the cached provider instance. */
export function resetEmailProviderForTesting(): void {
  cached = null;
}
