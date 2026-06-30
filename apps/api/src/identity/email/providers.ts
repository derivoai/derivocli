/**
 * Provider-agnostic email abstraction.
 *
 * Providers:
 *   resend    — live, uses the official Resend SDK with retry on transient errors
 *   postmark  — stub (ready for future use)
 *   sendgrid  — stub (ready for future use)
 *   none      — no-op default (logs intent, never delivers)
 *
 * Call getEmailProvider(config.emailProvider) to get the active provider.
 * The factory caches the instance so the SDK client is only constructed once.
 */
import { Resend } from 'resend';
import { logger } from '../../infra/logger.js';
import { withRetry } from '../../infra/resilience.js';

export interface EmailMessage {
  /** Recipient address. */
  to: string;
  subject: string;
  html: string;
  /** Plain-text fallback (required by email standards). */
  text: string;
  /**
   * Override the sender for this specific message.
   * Falls back to the globally configured EMAIL_FROM.
   */
  from?: string;
}

export interface EmailProvider {
  readonly name: string;
  /**
   * True if this provider is wired up and can deliver mail right now.
   * Callers should check this to decide whether to surface warnings.
   */
  readonly canSend: boolean;
  send(message: EmailMessage): Promise<void>;
}

// ── Resend ────────────────────────────────────────────────────────────────────

/** HTTP status codes that are safe to retry (rate-limit / gateway error). */
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

function isRetryable(err: unknown): boolean {
  // Resend SDK throws a standard Error with the HTTP status embedded.
  const msg = err instanceof Error ? err.message : String(err);
  for (const s of RETRYABLE_STATUSES) {
    if (msg.includes(String(s))) return true;
  }
  return false;
}

export class ResendEmailProvider implements EmailProvider {
  readonly name = 'resend';
  readonly canSend = true;

  private readonly client: Resend;
  private readonly defaultFrom: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) {
      throw new Error(
        'RESEND_API_KEY is not set. Add it to your .env file (EMAIL_PROVIDER=resend requires it).',
      );
    }
    this.client = new Resend(apiKey);
    this.defaultFrom = process.env.EMAIL_FROM?.trim() || 'Derivo <noreply@derivo.in>';
  }

  async send(message: EmailMessage): Promise<void> {
    await withRetry(
      async () => {
        const { error, data } = await this.client.emails.send({
          from: message.from ?? this.defaultFrom,
          to: [message.to],
          subject: message.subject,
          html: message.html,
          text: message.text,
        });

        if (error) {
          throw new Error(`Resend error: ${error.name} — ${error.message}`);
        }

        logger.info('email sent via resend', {
          to: message.to,
          subject: message.subject,
          id: data?.id,
        });
      },
      {
        retries: 2,
        baseDelayMs: 300,
        maxDelayMs: 3_000,
        shouldRetry: isRetryable,
        label: 'resend.send',
      },
    );
  }
}

// ── Postmark (stub) ───────────────────────────────────────────────────────────
export class PostmarkEmailProvider implements EmailProvider {
  readonly name = 'postmark';
  readonly canSend = false;
  async send(_message: EmailMessage): Promise<void> {
    throw new Error('Postmark email provider is not implemented yet.');
  }
}

// ── SendGrid (stub) ───────────────────────────────────────────────────────────
export class SendGridEmailProvider implements EmailProvider {
  readonly name = 'sendgrid';
  readonly canSend = false;
  async send(_message: EmailMessage): Promise<void> {
    throw new Error('SendGrid email provider is not implemented yet.');
  }
}

// ── Noop ─────────────────────────────────────────────────────────────────────
export class NoopEmailProvider implements EmailProvider {
  readonly name = 'none';
  readonly canSend = false;
  async send(message: EmailMessage): Promise<void> {
    logger.warn('email send skipped — no provider configured', {
      to: message.to,
      subject: message.subject,
    });
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────
let _cached: EmailProvider | null = null;

export function getEmailProvider(name: string): EmailProvider {
  if (_cached && _cached.name === name) return _cached;
  switch (name) {
    case 'resend':
      _cached = new ResendEmailProvider();
      break;
    case 'postmark':
      _cached = new PostmarkEmailProvider();
      break;
    case 'sendgrid':
      _cached = new SendGridEmailProvider();
      break;
    default:
      _cached = new NoopEmailProvider();
  }
  return _cached;
}

/** Drop the cached provider (tests / config reload). */
export function resetEmailProviderForTesting(): void {
  _cached = null;
}
