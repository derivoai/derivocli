import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUserProfile } from '../../hooks/useUserProfile';
import { auth } from '../../lib/firebase';
import { Loader2 } from 'lucide-react';

export function CliLogin() {
  const [searchParams] = useSearchParams();
  const { profile, loading } = useUserProfile();
  const [status, setStatus] = useState<'authenticating' | 'redirecting' | 'error'>(
    'authenticating',
  );
  const [errorMessage, setErrorMessage] = useState('');

  const port = searchParams.get('port');

  useEffect(() => {
    if (loading) return;

    if (!port) {
      setStatus('error');
      setErrorMessage('No CLI port specified.');
      return;
    }

    if (!profile) {
      // If the user isn't logged in to the web app, redirect to normal login with return URL
      const currentUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?callbackUrl=${currentUrl}`;
      return;
    }

    // User is logged in, extract token and redirect back to CLI
    const handleRedirect = async () => {
      setStatus('redirecting');
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('Firebase user not found');

        // Get the ID token
        const token = await currentUser.getIdToken();

        // Redirect to CLI local server
        const callbackUrl = `http://localhost:${port}/callback?token=${encodeURIComponent(token)}&uid=${encodeURIComponent(currentUser.uid)}&email=${encodeURIComponent(currentUser.email || '')}`;

        window.location.href = callbackUrl;
      } catch (err) {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Failed to generate auth token');
      }
    };

    handleRedirect();
  }, [loading, profile, port]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-xl p-8 text-center space-y-6">
        {status === 'authenticating' && (
          <>
            <Loader2 className="w-12 h-12 text-green-400 animate-spin mx-auto" />
            <h2 className="text-xl font-medium">Authenticating CLI...</h2>
            <p className="text-sm text-gray-400">Please wait while we verify your session.</p>
          </>
        )}

        {status === 'redirecting' && (
          <>
            <Loader2 className="w-12 h-12 text-green-400 animate-spin mx-auto" />
            <h2 className="text-xl font-medium">Redirecting to CLI...</h2>
            <p className="text-sm text-gray-400">
              You will be securely redirected back to your terminal shortly.
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto text-xl">
              !
            </div>
            <h2 className="text-xl font-medium text-red-400">Authentication Failed</h2>
            <p className="text-sm text-gray-400">{errorMessage}</p>
          </>
        )}
      </div>
    </div>
  );
}
