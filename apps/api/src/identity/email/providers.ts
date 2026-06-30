/**
 * Provider-agnostic email abstraction.
 *
 * Providers: Resend (live), Postmark / SendGrid (stubs ready for future use),
 * Noop (default until a provider is configured).
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

// ── Noop ─────────────────────────────────────────────────────────────────────
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

// ── Resend ────────────────────────────────────────────────────────────────────
export class ResendEmailProvider implements EmailProvider {
  readonly name = 'resend';
  readonly canSend = true;
  private readonly apiKey: string;
  private readonly from: string;

  constructor() {
    const key = process.env.RESEND_API_KEY?.trim();
    if (!key) throw new Error('RESEND_API_KEY is not set');
    this.apiKey = key;
    this.from = process.env.EMAIL_FROM?.trim() || 'Derivo <noreply@derivo.in>';
  }

  async send(message: EmailMessage): Promise<void> {
    const payload = {
      from: message.from || this.from,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      ...(message.text ? { text: message.text } : {}),
    };

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Resend API error ${res.status}: ${body}`);
    }

    const data = await res.json().catch(() => ({}));
    logger.info('email sent via resend', { to: message.to, subject: message.subject, id: data.id });
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

// ── Factory ───────────────────────────────────────────────────────────────────
let cached: EmailProvider | null = null;

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
