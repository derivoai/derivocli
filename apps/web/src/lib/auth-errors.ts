/**
 * Maps Firebase Auth error codes to user-friendly messages. Raw Firebase error
 * codes (e.g. `auth/invalid-action-code`) must NEVER be shown to users — always
 * route through this helper so messaging stays consistent and non-leaky.
 */

export interface FriendlyError {
  /** Short, human title for the error state. */
  title: string;
  /** One-line explanation safe to show the user. */
  message: string;
}

/** Extract a Firebase error code from an unknown thrown value. */
export function authErrorCode(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    return String((err as { code: unknown }).code ?? '');
  }
  return '';
}

/**
 * Translate a Firebase error (or code) into a friendly title + message.
 * `context` lets us tailor copy per action while reusing the same mapping.
 */
export function friendlyAuthError(
  err: unknown,
  context: 'verifyEmail' | 'resetPassword' | 'recoverEmail' | 'changeEmail' | 'generic' = 'generic',
): FriendlyError {
  const code = typeof err === 'string' ? err : authErrorCode(err);

  switch (code) {
    case 'auth/expired-action-code':
      return {
        title: titleFor(context),
        message: 'This link has expired. Please request a new one and try again.',
      };
    case 'auth/invalid-action-code':
      return {
        title: titleFor(context),
        message: 'This link is invalid or has already been used. Please request a new one.',
      };
    case 'auth/user-disabled':
      return {
        title: titleFor(context),
        message: 'This account has been disabled. Please contact support if you need help.',
      };
    case 'auth/user-not-found':
      return {
        title: titleFor(context),
        message: "We couldn't find an account for this request.",
      };
    case 'auth/weak-password':
      return {
        title: 'Password too weak',
        message: 'Please choose a stronger password with at least 8 characters.',
      };
    case 'auth/network-request-failed':
      return {
        title: 'Connection problem',
        message: 'We could not reach our servers. Check your connection and try again.',
      };
    case 'auth/too-many-requests':
      return {
        title: 'Too many attempts',
        message: 'Too many requests. Please wait a moment before trying again.',
      };
    default:
      return {
        title: titleFor(context),
        message: 'Something went wrong. Please try again or request a new link.',
      };
  }
}

function titleFor(context: string): string {
  switch (context) {
    case 'verifyEmail':
      return 'Verification failed';
    case 'resetPassword':
      return 'Reset failed';
    case 'recoverEmail':
      return 'Recovery failed';
    case 'changeEmail':
      return 'Email update failed';
    default:
      return 'Something went wrong';
  }
}
