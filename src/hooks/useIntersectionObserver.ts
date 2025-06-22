import { useState, useEffect, useRef, useCallback } from 'react';

type UseIntersectionObserverOptions = {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
  initialIsIntersecting?: boolean;
};

type IntersectionObserverEntry = {
  isIntersecting: boolean;
  intersectionRatio: number;
  boundingClientRect: DOMRectReadOnly;
  intersectionRect: DOMRectReadOnly;
  rootBounds: DOMRectReadOnly | null;
  target: Element;
  time: number;
};

/**
 * Custom hook for Intersection Observer API
 * @param options - Intersection Observer options
 * @returns Object with ref, isIntersecting state, and entry
 */
export function useIntersectionObserver<T extends Element = HTMLDivElement>(
  options: UseIntersectionObserverOptions = {}
) {
  const {
    threshold = 0,
    root = null,
    rootMargin = '0%',
    freezeOnceVisible = false,
    initialIsIntersecting = false,
  } = options;

  const [entry, setEntry] = useState<IntersectionObserverEntry | undefined>();
  const [isIntersecting, setIsIntersecting] = useState(initialIsIntersecting);
  const elementRef = useRef<T>(null);
  const frozen = useRef(false);

  const updateEntry = useCallback(
    ([entry]: globalThis.IntersectionObserverEntry[]) => {
      if (frozen.current) return;

      setEntry(entry as IntersectionObserverEntry);
      setIsIntersecting(entry.isIntersecting);

      if (freezeOnceVisible && entry.isIntersecting) {
        frozen.current = true;
      }
    },
    [freezeOnceVisible]
  );

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Check if IntersectionObserver is supported
    if (!window.IntersectionObserver) {
      console.warn('IntersectionObserver is not supported in this browser');
      return;
    }

    const observer = new IntersectionObserver(updateEntry, {
      threshold,
      root,
      rootMargin,
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, root, rootMargin, updateEntry]);

  // Reset frozen state when element changes
  useEffect(() => {
    frozen.current = false;
  }, [elementRef.current]);

  return {
    ref: elementRef,
    isIntersecting,
    entry,
  };
}

/**
 * Hook for lazy loading images or components
 * @param options - Intersection Observer options
 * @returns Object with ref and isVisible state
 */
export function useLazyLoad<T extends Element = HTMLDivElement>(
  options: UseIntersectionObserverOptions = {}
) {
  const { ref, isIntersecting } = useIntersectionObserver<T>({
    freezeOnceVisible: true,
    threshold: 0.1,
    ...options,
  });

  return {
    ref,
    isVisible: isIntersecting,
  };
}

/**
 * Hook for infinite scrolling
 * @param callback - Function to call when element becomes visible
 * @param options - Intersection Observer options
 * @returns Ref to attach to the trigger element
 */
export function useInfiniteScroll<T extends Element = HTMLDivElement>(
  callback: () => void,
  options: UseIntersectionObserverOptions = {}
) {
  const { ref, isIntersecting } = useIntersectionObserver<T>({
    threshold: 1.0,
    ...options,
  });

  useEffect(() => {
    if (isIntersecting) {
      callback();
    }
  }, [isIntersecting, callback]);

  return ref;
}

/**
 * Hook for tracking element visibility with percentage
 * @param options - Intersection Observer options
 * @returns Object with ref, visibility percentage, and isVisible state
 */
export function useVisibilityPercentage<T extends Element = HTMLDivElement>(
  options: UseIntersectionObserverOptions = {}
) {
  const [visibilityPercentage, setVisibilityPercentage] = useState(0);

  const { ref, isIntersecting, entry } = useIntersectionObserver<T>({
    threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
    ...options,
  });

  useEffect(() => {
    if (entry) {
      setVisibilityPercentage(Math.round(entry.intersectionRatio * 100));
    }
  }, [entry]);

  return {
    ref,
    isVisible: isIntersecting,
    visibilityPercentage,
  };
}

/**
 * Hook for animating elements when they come into view
 * @param animationClass - CSS class to add when element is visible
 * @param options - Intersection Observer options
 * @returns Object with ref and animation state
 */
export function useScrollAnimation<T extends Element = HTMLDivElement>(
  animationClass: string = 'animate-in',
  options: UseIntersectionObserverOptions = {}
) {
  const [hasAnimated, setHasAnimated] = useState(false);

  const { ref, isIntersecting } = useIntersectionObserver<T>({
    freezeOnceVisible: true,
    threshold: 0.1,
    ...options,
  });

  useEffect(() => {
    if (isIntersecting && !hasAnimated) {
      const element = ref.current;
      if (element) {
        element.classList.add(animationClass);
        setHasAnimated(true);
      }
    }
  }, [isIntersecting, hasAnimated, animationClass, ref]);

  return {
    ref,
    isVisible: isIntersecting,
    hasAnimated,
  };
}

/**
 * Hook for tracking multiple elements intersection
 * @param options - Intersection Observer options
 * @returns Object with addRef function and entries map
 */
export function useMultipleIntersectionObserver(options: UseIntersectionObserverOptions = {}) {
  const [entries, setEntries] = useState<Map<Element, IntersectionObserverEntry>>(new Map());
  const observer = useRef<IntersectionObserver | null>(null);
  const elements = useRef<Set<Element>>(new Set());

  const { threshold = 0, root = null, rootMargin = '0%' } = options;

  useEffect(() => {
    if (!window.IntersectionObserver) {
      console.warn('IntersectionObserver is not supported in this browser');
      return;
    }

    observer.current = new IntersectionObserver(
      observerEntries => {
        setEntries(prev => {
          const newEntries = new Map(prev);
          observerEntries.forEach(entry => {
            newEntries.set(entry.target, entry as IntersectionObserverEntry);
          });
          return newEntries;
        });
      },
      { threshold, root, rootMargin }
    );

    // Observe all existing elements
    elements.current.forEach(element => {
      observer.current?.observe(element);
    });

    return () => {
      observer.current?.disconnect();
    };
  }, [threshold, root, rootMargin]);

  const addRef = useCallback((element: Element | null) => {
    if (!element || !observer.current) return;

    elements.current.add(element);
    observer.current.observe(element);
  }, []);

  const removeRef = useCallback((element: Element) => {
    if (!observer.current) return;

    elements.current.delete(element);
    observer.current.unobserve(element);
    setEntries(prev => {
      const newEntries = new Map(prev);
      newEntries.delete(element);
      return newEntries;
    });
  }, []);

  return {
    addRef,
    removeRef,
    entries,
  };
}
