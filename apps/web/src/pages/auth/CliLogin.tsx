import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUserProfile } from '../../hooks/useUserProfile';
import { auth } from '../../lib/firebase';
import { getApiBaseUrl } from '../../lib/api';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export function CliLogin() {
  const [searchParams] = useSearchParams();
  const { profile, loading } = useUserProfile();
  const [status, setStatus] = useState<'authenticating' | 'completing' | 'done' | 'error'>(
    'authenticating',
  );
  const [errorMessage, setErrorMessage] = useState('');

  const state = searchParams.get('state');
  // Legacy support: old CLI versions pass ?port=
  const port = searchParams.get('port');

  useEffect(() => {
    if (loading) return;

    if (!state && !port) {
      setStatus('error');
      setErrorMessage('No authentication session specified.');
      return;
    }

    if (!profile) {
      const currentUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?callbackUrl=${currentUrl}`;
      return;
    }

    const handleAuth = async () => {
      setStatus('completing');
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('Firebase user not found');

        const token = await currentUser.getIdToken();

        // New flow: POST state + token to API, no localhost involved
        if (state) {
          const apiBase = getApiBaseUrl();
          const res = await fetch(`${apiBase}/api/cli/auth/complete`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ state }),
          });

          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || `Server error (${res.status})`);
          }

          setStatus('done');
          // Auto-close after 3 seconds
          setTimeout(() => window.close(), 3000);
          return;
        }

        // Legacy flow: redirect to localhost (old CLI versions)
        if (port) {
          const callbackUrl = `http://localhost:${port}/callback?token=${encodeURIComponent(token)}&uid=${encodeURIComponent(currentUser.uid)}&email=${encodeURIComponent(currentUser.email || '')}`;
          window.location.href = callbackUrl;
        }
      } catch (err) {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Failed to complete authentication');
      }
    };

    handleAuth();
  }, [loading, profile, state, port]);

  return (
    <div className="lightui min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-background border border-border rounded-xl p-8 text-center space-y-6">
        {(status === 'authenticating' || status === 'completing') && (
          <>
            <Loader2 className="w-12 h-12 text-accent animate-spin mx-auto" />
            <h2 className="text-xl font-medium">
              {status === 'authenticating' ? 'Authenticating...' : 'Completing login...'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {status === 'authenticating'
                ? 'Verifying your session...'
                : 'Securely passing your credentials to the CLI...'}
            </p>
          </>
        )}

        {status === 'done' && (
          <>
            <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
            <h2 className="text-xl font-medium text-emerald-600">Login Successful</h2>
            <p className="text-sm text-muted-foreground">
              You're authenticated. Return to your terminal — this window will close automatically.
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-red-600 mx-auto" />
            <h2 className="text-xl font-medium text-red-600">Authentication Failed</h2>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <button
              onClick={() => window.close()}
              className="text-sm text-muted-foreground underline hover:text-foreground"
            >
              Close this window
            </button>
          </>
        )}
      </div>
    </div>
  );
}
