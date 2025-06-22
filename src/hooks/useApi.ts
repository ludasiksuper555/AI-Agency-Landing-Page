import { useCallback, useEffect, useRef, useState } from 'react';

import { useDebounce } from './useDebounce';
import { useMounted } from './useMounted';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type ApiConfig = {
  baseURL?: string;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  cache?: boolean;
  cacheTime?: number;
};

type RequestConfig = {
  method?: RequestMethod;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, any>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  cache?: boolean;
  transform?: (data: any) => any;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
};

type ApiState<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
  status: number | null;
  headers: Headers | null;
};

type UseApiReturn<T> = ApiState<T> & {
  execute: (config?: Partial<RequestConfig>) => Promise<T | null>;
  reset: () => void;
  cancel: () => void;
};

type UseMutationReturn<T, V = any> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
  mutate: (variables?: V, config?: Partial<RequestConfig>) => Promise<T | null>;
  reset: () => void;
};

// Global cache for API responses
const apiCache = new Map<string, { data: any; timestamp: number; cacheTime: number }>();

// Global API configuration
let globalApiConfig: ApiConfig = {
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
  cache: false,
  cacheTime: 5 * 60 * 1000, // 5 minutes
};

/**
 * Set global API configuration
 * @param config - Global API configuration
 */
export function setApiConfig(config: Partial<ApiConfig>) {
  globalApiConfig = { ...globalApiConfig, ...config };
}

/**
 * Get global API configuration
 * @returns Current global API configuration
 */
export function getApiConfig(): ApiConfig {
  return globalApiConfig;
}

/**
 * Clear API cache
 * @param pattern - Optional pattern to match cache keys
 */
export function clearApiCache(pattern?: string | RegExp) {
  if (!pattern) {
    apiCache.clear();
    return;
  }

  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

  for (const [key] of apiCache) {
    if (regex.test(key)) {
      apiCache.delete(key);
    }
  }
}

/**
 * Build URL with query parameters
 * @param url - Base URL
 * @param params - Query parameters
 * @returns URL with query string
 */
function buildUrl(url: string, params?: Record<string, any>): string {
  if (!params || Object.keys(params).length === 0) {
    return url;
  }

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, String(v)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${url}?${queryString}` : url;
}

/**
 * Create cache key for request
 * @param url - Request URL
 * @param config - Request configuration
 * @returns Cache key
 */
function createCacheKey(url: string, config: RequestConfig): string {
  const { method = 'GET', body, params } = config;
  return JSON.stringify({ url, method, body, params });
}

/**
 * Get cached response
 * @param cacheKey - Cache key
 * @returns Cached data or null
 */
function getCachedResponse(cacheKey: string): any | null {
  const cached = apiCache.get(cacheKey);

  if (!cached) return null;

  const now = Date.now();
  if (now - cached.timestamp > cached.cacheTime) {
    apiCache.delete(cacheKey);
    return null;
  }

  return cached.data;
}

/**
 * Set cached response
 * @param cacheKey - Cache key
 * @param data - Response data
 * @param cacheTime - Cache time in milliseconds
 */
function setCachedResponse(cacheKey: string, data: any, cacheTime: number) {
  apiCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    cacheTime,
  });
}

/**
 * Make HTTP request with retry logic
 * @param url - Request URL
 * @param config - Request configuration
 * @returns Promise with response data
 */
async function makeRequest<T>(
  url: string,
  config: RequestConfig = {}
): Promise<{ data: T; status: number; headers: Headers }> {
  const {
    method = 'GET',
    headers = {},
    body,
    params,
    timeout = globalApiConfig.timeout,
    retries = globalApiConfig.retries,
    retryDelay = globalApiConfig.retryDelay,
    cache = globalApiConfig.cache,
    transform,
  } = config;

  const fullUrl = buildUrl(
    url.startsWith('http') ? url : `${globalApiConfig.baseURL}${url}`,
    params
  );

  // Check cache for GET requests
  if (method === 'GET' && cache) {
    const cacheKey = createCacheKey(fullUrl, config);
    const cachedData = getCachedResponse(cacheKey);

    if (cachedData) {
      return cachedData;
    }
  }

  const requestHeaders = {
    ...globalApiConfig.headers,
    ...headers,
  };

  const requestInit: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body && method !== 'GET') {
    if (typeof body === 'object' && !(body instanceof FormData)) {
      requestInit.body = JSON.stringify(body);
    } else {
      requestInit.body = body;
    }
  }

  let lastError: Error;

  for (let attempt = 0; attempt <= retries!; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      requestInit.signal = controller.signal;

      const response = await fetch(fullUrl, requestInit);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      let data: T;
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else if (contentType?.includes('text/')) {
        data = (await response.text()) as unknown as T;
      } else {
        data = (await response.blob()) as unknown as T;
      }

      // Transform data if transformer provided
      if (transform) {
        data = transform(data);
      }

      const result = {
        data,
        status: response.status,
        headers: response.headers,
      };

      // Cache successful GET requests
      if (method === 'GET' && cache && response.status < 400) {
        const cacheKey = createCacheKey(fullUrl, config);
        setCachedResponse(cacheKey, result, globalApiConfig.cacheTime!);
      }

      return result;
    } catch (error) {
      lastError = error as Error;

      // Don't retry on abort or client errors
      if (
        error instanceof Error &&
        (error.name === 'AbortError' || error.message.includes('HTTP 4'))
      ) {
        break;
      }

      // Wait before retry
      if (attempt < retries!) {
        await new Promise(resolve => setTimeout(resolve, retryDelay! * (attempt + 1)));
      }
    }
  }

  throw lastError!;
}

/**
 * Hook for making API requests
 * @param url - Request URL
 * @param config - Request configuration
 * @returns API state and utilities
 */
export function useApi<T = any>(url: string, config: RequestConfig = {}): UseApiReturn<T> {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
    status: null,
    headers: null,
  });

  const mounted = useMounted();
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(
    async (overrideConfig: Partial<RequestConfig> = {}) => {
      if (!mounted) return null;

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const mergedConfig = { ...config, ...overrideConfig };
        const result = await makeRequest<T>(url, mergedConfig);

        if (mounted) {
          setState({
            data: result.data,
            loading: false,
            error: null,
            status: result.status,
            headers: result.headers,
          });

          if (mergedConfig.onSuccess) {
            mergedConfig.onSuccess(result.data);
          }
        }

        return result.data;
      } catch (error) {
        const apiError = error as Error;

        if (mounted && apiError.name !== 'AbortError') {
          setState(prev => ({
            ...prev,
            loading: false,
            error: apiError,
          }));

          if (config.onError) {
            config.onError(apiError);
          }
        }

        return null;
      }
    },
    [url, config, mounted]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      status: null,
      headers: null,
    });
  }, []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Auto-execute for GET requests
  useEffect(() => {
    if (config.method === 'GET' || !config.method) {
      execute();
    }
  }, [url, execute]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    execute,
    reset,
    cancel,
  };
}

/**
 * Hook for mutations (POST, PUT, PATCH, DELETE)
 * @param url - Request URL
 * @param config - Request configuration
 * @returns Mutation state and utilities
 */
export function useMutation<T = any, V = any>(
  url: string,
  config: RequestConfig = {}
): UseMutationReturn<T, V> {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: Error | null;
  }>({
    data: null,
    loading: false,
    error: null,
  });

  const mounted = useMounted();
  const abortControllerRef = useRef<AbortController | null>(null);

  const mutate = useCallback(
    async (variables?: V, overrideConfig: Partial<RequestConfig> = {}) => {
      if (!mounted) return null;

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const mergedConfig = {
          method: 'POST' as RequestMethod,
          ...config,
          ...overrideConfig,
          body: variables || config.body,
        };

        const result = await makeRequest<T>(url, mergedConfig);

        if (mounted) {
          setState({
            data: result.data,
            loading: false,
            error: null,
          });

          if (mergedConfig.onSuccess) {
            mergedConfig.onSuccess(result.data);
          }
        }

        return result.data;
      } catch (error) {
        const apiError = error as Error;

        if (mounted && apiError.name !== 'AbortError') {
          setState(prev => ({
            ...prev,
            loading: false,
            error: apiError,
          }));

          if (config.onError) {
            config.onError(apiError);
          }
        }

        return null;
      }
    },
    [url, config, mounted]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}

/**
 * Hook for infinite scrolling/pagination
 * @param url - Base URL
 * @param config - Request configuration
 * @returns Infinite query state and utilities
 */
export function useInfiniteQuery<T = any>(
  url: string,
  config: RequestConfig & {
    getNextPageParam?: (lastPage: T, allPages: T[]) => any;
    initialPageParam?: any;
  } = {}
) {
  const { getNextPageParam = () => null, initialPageParam = 1, ...requestConfig } = config;

  const [state, setState] = useState({
    data: [] as T[],
    loading: false,
    error: null as Error | null,
    hasNextPage: true,
    isFetchingNextPage: false,
  });

  const mounted = useMounted();
  const pageParamRef = useRef(initialPageParam);

  const fetchNextPage = useCallback(async () => {
    if (!state.hasNextPage || state.isFetchingNextPage || !mounted) {
      return;
    }

    setState(prev => ({ ...prev, isFetchingNextPage: true, error: null }));

    try {
      const result = await makeRequest<T>(url, {
        ...requestConfig,
        params: {
          ...requestConfig.params,
          page: pageParamRef.current,
        },
      });

      if (mounted) {
        setState(prev => {
          const newData = [...prev.data, result.data];
          const nextPageParam = getNextPageParam(result.data, newData);

          pageParamRef.current = nextPageParam;

          return {
            ...prev,
            data: newData,
            isFetchingNextPage: false,
            hasNextPage: nextPageParam != null,
          };
        });
      }
    } catch (error) {
      if (mounted) {
        setState(prev => ({
          ...prev,
          isFetchingNextPage: false,
          error: error as Error,
        }));
      }
    }
  }, [url, requestConfig, state.hasNextPage, state.isFetchingNextPage, mounted, getNextPageParam]);

  const reset = useCallback(() => {
    setState({
      data: [],
      loading: false,
      error: null,
      hasNextPage: true,
      isFetchingNextPage: false,
    });
    pageParamRef.current = initialPageParam;
  }, [initialPageParam]);

  // Initial fetch
  useEffect(() => {
    fetchNextPage();
  }, []);

  return {
    ...state,
    fetchNextPage,
    reset,
  };
}

/**
 * Hook for debounced API requests (useful for search)
 * @param url - Request URL
 * @param query - Search query
 * @param config - Request configuration
 * @param debounceMs - Debounce delay in milliseconds
 * @returns Debounced API state
 */
export function useDebouncedApi<T = any>(
  url: string,
  query: string,
  config: RequestConfig = {},
  debounceMs: number = 300
) {
  const debouncedQuery = useDebounce(query, debounceMs);

  return useApi<T>(url, {
    ...config,
    params: {
      ...config.params,
      q: debouncedQuery,
    },
  });
}

/**
 * Hook for optimistic updates
 * @param url - Request URL
 * @param config - Request configuration
 * @returns Optimistic mutation utilities
 */
export function useOptimisticMutation<T = any, V = any>(url: string, config: RequestConfig = {}) {
  const mutation = useMutation<T, V>(url, config);
  const [optimisticData, setOptimisticData] = useState<T | null>(null);
  const [isOptimistic, setIsOptimistic] = useState(false);

  const mutateOptimistic = useCallback(
    async (variables?: V, optimisticUpdate?: T, overrideConfig?: Partial<RequestConfig>) => {
      // Apply optimistic update
      if (optimisticUpdate) {
        setOptimisticData(optimisticUpdate);
        setIsOptimistic(true);
      }

      try {
        const result = await mutation.mutate(variables, overrideConfig);

        // Clear optimistic state on success
        setOptimisticData(null);
        setIsOptimistic(false);

        return result;
      } catch (error) {
        // Revert optimistic update on error
        setOptimisticData(null);
        setIsOptimistic(false);
        throw error;
      }
    },
    [mutation]
  );

  return {
    ...mutation,
    data: isOptimistic ? optimisticData : mutation.data,
    isOptimistic,
    mutate: mutateOptimistic,
  };
}
