import { useState, useCallback } from 'react';

interface UseRetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  onRetry?: (attempt: number) => void;
}

/**
 * Custom hook for retrying async operations with exponential backoff
 */
export function useRetry<T>(
  asyncFn: () => Promise<T>,
  options: UseRetryOptions = {}
) {
  const { maxRetries = 3, retryDelay = 1000, onRetry } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const execute = useCallback(async (): Promise<T | null> => {
    setLoading(true);
    setError(null);
    setRetryCount(0);

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await asyncFn();
        setLoading(false);
        setRetryCount(0);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        
        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          setError(error);
          setLoading(false);
          return null;
        }

        // Exponential backoff
        const delay = retryDelay * Math.pow(2, attempt);
        setRetryCount(attempt + 1);
        
        if (onRetry) {
          onRetry(attempt + 1);
        }

        await sleep(delay);
      }
    }

    setLoading(false);
    return null;
  }, [asyncFn, maxRetries, retryDelay, onRetry]);

  const reset = useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  return {
    execute,
    loading,
    error,
    retryCount,
    reset,
  };
}


