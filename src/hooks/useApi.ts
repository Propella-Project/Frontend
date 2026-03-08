import { useState, useCallback, useEffect, useRef } from "react";
import type { AxiosError } from "axios";
import { getErrorMessage, isAuthError, isNetworkError } from "@/api/client";

export type LoadingState = "idle" | "loading" | "success" | "error";

export interface UseApiOptions<T> {
  /** Initial data to use before first successful fetch */
  initialData?: T;
  /** Fallback data to use when API fails */
  fallbackData?: T;
  /** Whether to fetch on mount */
  autoFetch?: boolean;
  /** Dependencies that trigger refetch when changed */
  deps?: unknown[];
  /** Callback when fetch succeeds */
  onSuccess?: (data: T) => void;
  /** Callback when fetch fails */
  onError?: (error: Error) => void;
  /** Whether to show toast on error */
  showErrorToast?: boolean;
  /** Custom error message */
  errorMessage?: string;
  /** Delay before fetching (ms) - useful for staggered loading */
  delay?: number;
}

export interface UseApiReturn<T, P = void> {
  /** Current data */
  data: T | null;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Current state */
  state: LoadingState;
  /** Execute the API call */
  execute: (params?: P) => Promise<T | null>;
  /** Reset to initial state */
  reset: () => void;
  /** Manually set data */
  setData: (data: T | null) => void;
  /** Whether data is from fallback */
  isFallback: boolean;
  /** Whether error is auth-related */
  isAuthError: boolean;
  /** Whether error is network-related */
  isNetworkError: boolean;
  /** Error message string */
  errorMessage: string;
  /** Refetch with same parameters */
  refetch: () => Promise<T | null>;
  /** Clear error state */
  clearError: () => void;
}

/**
 * useApi Hook
 * Generic hook for API calls with loading states, error handling, and fallback support
 */
export function useApi<T, P = void>(
  apiFunction: (params: P) => Promise<T>,
  options: UseApiOptions<T> = {}
): UseApiReturn<T, P> {
  const {
    initialData = null,
    fallbackData = null,
    autoFetch = false,
    deps = [],
    onSuccess,
    onError,
    errorMessage: customErrorMessage,
    delay = 0,
  } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [state, setState] = useState<LoadingState>("idle");
  const [error, setError] = useState<Error | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  
  const paramsRef = useRef<P | undefined>(undefined);
  const isMountedRef = useRef(true);

  const execute = useCallback(
    async (params?: P): Promise<T | null> => {
      // Store params for refetch
      if (params !== undefined) {
        paramsRef.current = params;
      }

      setState("loading");
      setError(null);
      setIsFallback(false);

      // Apply delay if specified
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      // Check if still mounted after delay
      if (!isMountedRef.current) return null;

      try {
        const result = await apiFunction(params as P);
        
        if (!isMountedRef.current) return null;
        
        setData(result);
        setState("success");
        setIsFallback(false);
        onSuccess?.(result);
        
        return result;
      } catch (err) {
        if (!isMountedRef.current) return null;

        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setState("error");

        // Check if we should use fallback data
        if (fallbackData !== null) {
          setData(fallbackData);
          setIsFallback(true);
        }

        // Log error
        console.error("[useApi] API call failed:", error);

        // Call error handler
        onError?.(error);

        return null;
      }
    },
    [apiFunction, fallbackData, onSuccess, onError, delay]
  );

  const refetch = useCallback(async (): Promise<T | null> => {
    return execute(paramsRef.current);
  }, [execute]);

  const reset = useCallback(() => {
    setData(initialData);
    setState("idle");
    setError(null);
    setIsFallback(false);
    paramsRef.current = undefined;
  }, [initialData]);

  const clearError = useCallback(() => {
    setError(null);
    if (state === "error") {
      setState("idle");
    }
  }, [state]);

  // Auto-fetch on mount or when deps change
  useEffect(() => {
    isMountedRef.current = true;
    
    if (autoFetch) {
      execute();
    }

    return () => {
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const axiosError = error as AxiosError | null;
  const errorIsAuthError = axiosError ? isAuthError(axiosError) : false;
  const errorIsNetworkError = axiosError ? isNetworkError(axiosError) : false;

  return {
    data,
    loading: state === "loading",
    error,
    state,
    execute,
    reset,
    setData,
    isFallback,
    isAuthError: errorIsAuthError,
    isNetworkError: errorIsNetworkError,
    errorMessage: error ? (customErrorMessage || getErrorMessage(error)) : "",
    refetch,
    clearError,
  };
}

/**
 * useApiWithFallback Hook
 * Simplified hook that always provides fallback data on error
 */
export function useApiWithFallback<T, P = void>(
  apiFunction: (params: P) => Promise<T>,
  fallbackData: T,
  options: Omit<UseApiOptions<T>, "fallbackData"> = {}
): Omit<UseApiReturn<T, P>, "isFallback"> & { data: T } {
  const result = useApi(apiFunction, { ...options, fallbackData });
  
  return {
    ...result,
    data: result.data ?? fallbackData,
  };
}

/**
 * useLazyApi Hook
 * API hook that doesn't auto-fetch - only fetches when execute is called
 */
export function useLazyApi<T, P = void>(
  apiFunction: (params: P) => Promise<T>,
  options: Omit<UseApiOptions<T>, "autoFetch" | "deps"> = {}
): UseApiReturn<T, P> {
  return useApi(apiFunction, { ...options, autoFetch: false });
}

/**
 * useParallelApi Hook
 * Execute multiple API calls in parallel
 */
export function useParallelApi<T extends Record<string, unknown>>(
  apiCalls: { [K in keyof T]: () => Promise<T[K]> },
  options: Omit<UseApiOptions<T>, "initialData" | "fallbackData"> = {}
): UseApiReturn<T> & { results: Partial<T> } {
  const combinedApiFunction = useCallback(async (): Promise<T> => {
    const entries = Object.entries(apiCalls) as [keyof T, () => Promise<T[keyof T]>][];
    const results = await Promise.allSettled(
      entries.map(([key, fn]) => 
        fn().then((value) => ({ key, value }))
      )
    );
    
    const combined = {} as T;
    const errors: Error[] = [];
    
    results.forEach((result, index) => {
      const key = entries[index][0];
      if (result.status === "fulfilled") {
        combined[key] = result.value.value;
      } else {
        errors.push(new Error(`${String(key)}: ${result.reason}`));
      }
    });
    
    if (errors.length > 0) {
      throw new Error(`Failed to fetch: ${errors.map((e) => e.message).join(", ")}`);
    }
    
    return combined;
  }, [apiCalls]);

  const result = useApi(combinedApiFunction, options);

  return {
    ...result,
    results: (result.data ?? {}) as Partial<T>,
  };
}

export default useApi;
