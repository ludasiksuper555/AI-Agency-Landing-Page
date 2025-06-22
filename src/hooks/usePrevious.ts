import { useEffect, useRef } from 'react';

/**
 * Custom hook that returns the previous value of a state or prop
 * @param value - The current value
 * @returns The previous value
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
}

/**
 * Hook that returns the previous value with a custom comparison function
 * @param value - The current value
 * @param compare - Custom comparison function (returns true if values are equal)
 * @returns The previous value
 */
export function usePreviousWithComparison<T>(
  value: T,
  compare: (prev: T | undefined, current: T) => boolean
): T | undefined {
  const ref = useRef<T>();
  const prevValue = ref.current;

  useEffect(() => {
    if (!compare(prevValue, value)) {
      ref.current = value;
    }
  });

  return ref.current;
}

/**
 * Hook that tracks multiple previous values
 * @param value - The current value
 * @param count - Number of previous values to track (default: 1)
 * @returns Array of previous values (most recent first)
 */
export function usePreviousValues<T>(value: T, count: number = 1): (T | undefined)[] {
  const ref = useRef<(T | undefined)[]>([]);

  useEffect(() => {
    ref.current = [value, ...ref.current.slice(0, count - 1)];
  });

  return ref.current.slice(1); // Exclude current value
}

/**
 * Hook that returns both current and previous value
 * @param value - The current value
 * @returns Object with current and previous values
 */
export function useCurrentAndPrevious<T>(value: T): {
  current: T;
  previous: T | undefined;
} {
  const previous = usePrevious(value);

  return {
    current: value,
    previous,
  };
}

/**
 * Hook that tracks if a value has changed
 * @param value - The value to track
 * @param compare - Optional custom comparison function
 * @returns Boolean indicating if value has changed
 */
export function useHasChanged<T>(
  value: T,
  compare?: (prev: T | undefined, current: T) => boolean
): boolean {
  const previous = usePrevious(value);

  if (compare) {
    return !compare(previous, value);
  }

  return previous !== value;
}

/**
 * Hook that tracks the previous value only when it actually changes
 * @param value - The current value
 * @param compare - Optional custom comparison function
 * @returns The previous different value
 */
export function usePreviousDistinct<T>(value: T, compare?: (a: T, b: T) => boolean): T | undefined {
  const ref = useRef<T>();
  const prevValue = ref.current;

  useEffect(() => {
    const hasChanged = compare
      ? prevValue !== undefined && !compare(prevValue, value)
      : prevValue !== value;

    if (hasChanged) {
      ref.current = prevValue;
    }
  });

  // Update ref for next comparison
  useEffect(() => {
    const hasChanged = compare
      ? prevValue !== undefined && !compare(prevValue, value)
      : prevValue !== value;

    if (prevValue === undefined || hasChanged) {
      ref.current = value;
    }
  });

  return prevValue;
}

/**
 * Hook that provides a stable reference to the previous value
 * Useful when you need to pass the previous value to other hooks' dependencies
 * @param value - The current value
 * @returns Stable reference to the previous value
 */
export function usePreviousStable<T>(value: T): T | undefined {
  const ref = useRef<{ value: T | undefined; generation: number }>({
    value: undefined,
    generation: 0,
  });

  const currentGeneration = ref.current.generation;

  useEffect(() => {
    ref.current = {
      value: value,
      generation: currentGeneration + 1,
    };
  });

  return ref.current.value;
}
