import { useEffect, useState } from 'react';

import { useDebounce } from './useDebounce';
import { useEventListener } from './useEventListener';

type WindowSize = {
  width: number;
  height: number;
  innerWidth: number;
  innerHeight: number;
  outerWidth: number;
  outerHeight: number;
};

type UseWindowSizeOptions = {
  debounceMs?: number;
  initialWidth?: number;
  initialHeight?: number;
};

/**
 * Custom hook for tracking window size
 * @param options - Configuration options
 * @returns Window size object
 */
export function useWindowSize(options: UseWindowSizeOptions = {}): WindowSize {
  const { debounceMs = 0, initialWidth = 0, initialHeight = 0 } = options;

  const [windowSize, setWindowSize] = useState<WindowSize>(() => {
    if (typeof window === 'undefined') {
      return {
        width: initialWidth,
        height: initialHeight,
        innerWidth: initialWidth,
        innerHeight: initialHeight,
        outerWidth: initialWidth,
        outerHeight: initialHeight,
      };
    }

    return {
      width: window.innerWidth,
      height: window.innerHeight,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      outerWidth: window.outerWidth,
      outerHeight: window.outerHeight,
    };
  });

  const debouncedWindowSize = useDebounce(windowSize, debounceMs);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateSize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        outerWidth: window.outerWidth,
        outerHeight: window.outerHeight,
      });
    };

    // Set initial size
    updateSize();

    window.addEventListener('resize', updateSize, { passive: true });

    return () => {
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  return debounceMs > 0 ? debouncedWindowSize : windowSize;
}

/**
 * Hook that returns only width and height
 * @param options - Configuration options
 * @returns Object with width and height
 */
export function useWindowDimensions(options: UseWindowSizeOptions = {}): {
  width: number;
  height: number;
} {
  const { width, height } = useWindowSize(options);
  return { width, height };
}

/**
 * Hook for tracking window size changes with callback
 * @param callback - Function to call when size changes
 * @param options - Configuration options
 */
export function useWindowSizeEffect(
  callback: (size: WindowSize) => void,
  options: UseWindowSizeOptions = {}
) {
  const windowSize = useWindowSize(options);

  useEffect(() => {
    callback(windowSize);
  }, [windowSize, callback]);
}

/**
 * Hook that returns window aspect ratio
 * @param options - Configuration options
 * @returns Aspect ratio (width / height)
 */
export function useWindowAspectRatio(options: UseWindowSizeOptions = {}): number {
  const { width, height } = useWindowSize(options);
  return height > 0 ? width / height : 0;
}

/**
 * Hook for detecting window size breakpoints
 * @param breakpoints - Object with breakpoint names and values
 * @param options - Configuration options
 * @returns Current breakpoint name
 */
export function useWindowBreakpoint<T extends Record<string, number>>(
  breakpoints: T,
  options: UseWindowSizeOptions = {}
): keyof T | null {
  const { width } = useWindowSize(options);

  // Sort breakpoints by value (ascending)
  const sortedBreakpoints = Object.entries(breakpoints)
    .sort(([, a], [, b]) => a - b)
    .reverse(); // Reverse to check from largest to smallest

  for (const [name, value] of sortedBreakpoints) {
    if (width >= value) {
      return name;
    }
  }

  return null;
}

/**
 * Hook for detecting if window is in landscape or portrait mode
 * @param options - Configuration options
 * @returns 'landscape' | 'portrait' | 'square'
 */
export function useWindowOrientation(
  options: UseWindowSizeOptions = {}
): 'landscape' | 'portrait' | 'square' {
  const { width, height } = useWindowSize(options);

  if (width > height) return 'landscape';
  if (height > width) return 'portrait';
  return 'square';
}

/**
 * Hook for getting window center coordinates
 * @param options - Configuration options
 * @returns Object with center x and y coordinates
 */
export function useWindowCenter(options: UseWindowSizeOptions = {}): {
  x: number;
  y: number;
} {
  const { width, height } = useWindowSize(options);

  return {
    x: width / 2,
    y: height / 2,
  };
}

/**
 * Hook for detecting if window size has changed
 * @param options - Configuration options
 * @returns Boolean indicating if size has changed since last render
 */
export function useWindowSizeChanged(options: UseWindowSizeOptions = {}): boolean {
  const windowSize = useWindowSize(options);
  const [hasChanged, setHasChanged] = useState(false);
  const [previousSize, setPreviousSize] = useState<WindowSize | null>(null);

  useEffect(() => {
    if (previousSize) {
      const changed =
        previousSize.width !== windowSize.width || previousSize.height !== windowSize.height;
      setHasChanged(changed);
    }
    setPreviousSize(windowSize);
  }, [windowSize, previousSize]);

  return hasChanged;
}

/**
 * Hook for getting viewport size (excluding scrollbars)
 * @param options - Configuration options
 * @returns Viewport dimensions
 */
export function useViewportSize(options: UseWindowSizeOptions = {}): {
  width: number;
  height: number;
} {
  const [viewportSize, setViewportSize] = useState(() => {
    if (typeof window === 'undefined') {
      return {
        width: options.initialWidth || 0,
        height: options.initialHeight || 0,
      };
    }

    return {
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight,
    };
  });

  const debouncedViewportSize = useDebounce(viewportSize, options.debounceMs || 0);

  useEventListener('resize', () => {
    if (typeof window !== 'undefined') {
      setViewportSize({
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight,
      });
    }
  });

  return options.debounceMs ? debouncedViewportSize : viewportSize;
}

/**
 * Common breakpoints for responsive design
 */
export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * Hook using common Tailwind CSS breakpoints
 * @param options - Configuration options
 * @returns Current breakpoint name
 */
export function useTailwindBreakpoint(options: UseWindowSizeOptions = {}) {
  return useWindowBreakpoint(BREAKPOINTS, options);
}
