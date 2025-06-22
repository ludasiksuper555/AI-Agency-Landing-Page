import React, { useEffect, useLayoutEffect } from 'react';

/**
 * Custom hook that uses useLayoutEffect on the client and useEffect on the server
 * This prevents hydration mismatches in SSR applications like Next.js
 */
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Hook that safely uses useLayoutEffect only on the client
 * @param effect - The effect function
 * @param deps - Dependencies array
 */
export function useClientLayoutEffect(effect: React.EffectCallback, deps?: React.DependencyList) {
  useIsomorphicLayoutEffect(() => {
    if (typeof window !== 'undefined') {
      return effect();
    }
  }, deps);
}

/**
 * Hook that runs an effect only after the component has mounted (client-side only)
 * @param effect - The effect function
 * @param deps - Dependencies array
 */
export function useClientOnlyEffect(effect: React.EffectCallback, deps?: React.DependencyList) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      return effect();
    }
  }, deps);
}

/**
 * Hook that provides a way to run effects differently on server vs client
 * @param serverEffect - Effect to run on server (SSR)
 * @param clientEffect - Effect to run on client
 * @param deps - Dependencies array
 */
export function useIsomorphicEffect(
  serverEffect: React.EffectCallback,
  clientEffect: React.EffectCallback,
  deps?: React.DependencyList
) {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return serverEffect();
    } else {
      return clientEffect();
    }
  }, deps);
}

/**
 * Hook that delays execution until after hydration is complete
 * Useful for preventing hydration mismatches
 * @param effect - The effect function
 * @param deps - Dependencies array
 */
export function useAfterHydration(effect: React.EffectCallback, deps?: React.DependencyList) {
  useEffect(() => {
    // Small delay to ensure hydration is complete
    const timeoutId = setTimeout(() => {
      return effect();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, deps);
}

/**
 * Hook that provides safe access to DOM APIs during SSR
 * @param callback - Function that uses DOM APIs
 * @param fallback - Fallback value for server-side
 * @param deps - Dependencies array
 * @returns The result of callback or fallback
 */
export function useSafeDOM<T>(callback: () => T, fallback: T, deps?: React.DependencyList): T {
  const [value, setValue] = React.useState<T>(fallback);

  useIsomorphicLayoutEffect(() => {
    if (typeof window !== 'undefined') {
      setValue(callback());
    }
  }, deps);

  return value;
}
