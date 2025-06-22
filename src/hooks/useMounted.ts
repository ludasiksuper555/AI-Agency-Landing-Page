import { useEffect, useState } from 'react';

import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';

/**
 * Hook to check if component is mounted (client-side)
 * Useful for preventing hydration mismatches in SSR
 * @returns Boolean indicating if component is mounted
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}

/**
 * Hook that returns a value only after component is mounted
 * @param value - Value to return after mounting
 * @param fallback - Fallback value before mounting
 * @returns Value after mounting, fallback before
 */
export function useMountedValue<T>(value: T, fallback: T): T {
  const mounted = useMounted();
  return mounted ? value : fallback;
}

/**
 * Hook that executes a callback only after component is mounted
 * @param callback - Function to execute after mounting
 * @param deps - Dependencies array
 */
export function useMountedEffect(callback: () => void | (() => void), deps?: React.DependencyList) {
  const mounted = useMounted();

  useEffect(() => {
    if (mounted) {
      return callback();
    }
  }, [mounted, ...(deps || [])]);
}

/**
 * Hook that provides a safe way to set state only when mounted
 * @param initialState - Initial state value
 * @returns [state, safeSetState] tuple
 */
export function useSafeState<T>(
  initialState: T | (() => T)
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState(initialState);
  const mounted = useMounted();

  const safeSetState: React.Dispatch<React.SetStateAction<T>> = value => {
    if (mounted) {
      setState(value);
    }
  };

  return [state, safeSetState];
}

/**
 * Hook for handling hydration-safe rendering
 * @param serverContent - Content to render on server
 * @param clientContent - Content to render on client
 * @returns Content based on mount status
 */
export function useHydrationSafe<T>(serverContent: T, clientContent: T): T {
  const mounted = useMounted();
  return mounted ? clientContent : serverContent;
}

/**
 * Hook that delays execution until after hydration
 * @param callback - Function to execute after hydration
 * @param delay - Additional delay in milliseconds
 */
export function useAfterHydration(callback: () => void, delay: number = 0) {
  const mounted = useMounted();

  useEffect(() => {
    if (mounted) {
      if (delay > 0) {
        const timeoutId = setTimeout(callback, delay);
        return () => clearTimeout(timeoutId);
      } else {
        callback();
      }
    }
  }, [mounted, callback, delay]);
}

/**
 * Hook for client-only rendering with loading state
 * @param content - Content to render on client
 * @param loading - Loading content
 * @returns Content or loading based on mount status
 */
export function useClientOnly<T>(content: T, loading?: T): T | undefined {
  const mounted = useMounted();

  if (!mounted) {
    return loading;
  }

  return content;
}

/**
 * Hook that provides mount status with layout effect
 * Useful when you need to know mount status synchronously
 * @returns Boolean indicating if component is mounted
 */
export function useMountedLayoutEffect(): boolean {
  const [mounted, setMounted] = useState(false);

  useIsomorphicLayoutEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}

/**
 * Hook for handling mount/unmount lifecycle with cleanup
 * @param onMount - Function to call on mount
 * @param onUnmount - Function to call on unmount
 */
export function useMountUnmount(onMount?: () => void | (() => void), onUnmount?: () => void) {
  useEffect(() => {
    let cleanup: (() => void) | void;

    if (onMount) {
      cleanup = onMount();
    }

    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
      if (onUnmount) {
        onUnmount();
      }
    };
  }, []);
}

/**
 * Hook that tracks mount duration
 * @returns Number of milliseconds since component mounted
 */
export function useMountDuration(): number {
  const [mountTime] = useState(() => Date.now());
  const [duration, setDuration] = useState(0);
  const mounted = useMounted();

  useEffect(() => {
    if (!mounted) return;

    const updateDuration = () => {
      setDuration(Date.now() - mountTime);
    };

    updateDuration();
    const intervalId = setInterval(updateDuration, 100);

    return () => clearInterval(intervalId);
  }, [mounted, mountTime]);

  return duration;
}

/**
 * Hook for conditional rendering based on mount status
 * @param condition - Additional condition to check
 * @returns Boolean indicating if should render
 */
export function useShouldRender(condition: boolean = true): boolean {
  const mounted = useMounted();
  return mounted && condition;
}

/**
 * Hook that provides a ref that's only set when mounted
 * @returns Ref object that's safe to use
 */
export function useMountedRef<T = HTMLElement>(): React.RefObject<T | null> {
  const mounted = useMounted();
  const ref = useState<{ current: T | null }>(() => ({ current: null }))[0];

  useEffect(() => {
    if (!mounted) {
      ref.current = null;
    }
  }, [mounted, ref]);

  return ref;
}

/**
 * Hook for handling SSR-safe localStorage access
 * @param key - localStorage key
 * @param defaultValue - Default value if not found
 * @returns [value, setValue] tuple
 */
export function useMountedLocalStorage<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const mounted = useMounted();
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      try {
        const item = window.localStorage.getItem(key);
        if (item) {
          setValue(JSON.parse(item));
        }
      } catch (error) {
        console.warn(`Error reading localStorage key "${key}":`, error);
      }
    }
  }, [mounted, key]);

  const setStoredValue = (newValue: T) => {
    if (mounted && typeof window !== 'undefined') {
      try {
        setValue(newValue);
        window.localStorage.setItem(key, JSON.stringify(newValue));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    }
  };

  return [value, setStoredValue];
}
