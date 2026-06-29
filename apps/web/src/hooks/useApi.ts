/**
 * Small data-fetching hook for backend API calls (loading / error / refetch).
 * Keeps pages free of repetitive fetch boilerplate while reflecting backend
 * state as the single source of truth.
 */
import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../lib/api';
import { useUserProfile } from './useUserProfile';

export interface ApiQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApiQuery<T>(fn: () => Promise<T>, deps: unknown[] = []): ApiQueryResult<T> {
  const { currentUser } = useUserProfile();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    if (!currentUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fn()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Request failed');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentUser, nonce, ...deps]);

  return { data, loading, error, refetch };
}
