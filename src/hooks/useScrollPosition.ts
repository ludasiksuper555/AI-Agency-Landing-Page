import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from './useDebounce';

type ScrollPosition = {
  x: number;
  y: number;
};

type UseScrollPositionOptions = {
  element?: React.RefObject<HTMLElement>;
  useWindow?: boolean;
  wait?: number;
  axis?: 'x' | 'y' | 'both';
};

/**
 * Custom hook for tracking scroll position
 * @param options - Configuration options
 * @returns Current scroll position
 */
export function useScrollPosition(options: UseScrollPositionOptions = {}): ScrollPosition {
  const { element, useWindow = true, wait = 0, axis = 'both' } = options;

  const [position, setPosition] = useState<ScrollPosition>({ x: 0, y: 0 });
  const debouncedPosition = useDebounce(position, wait);

  const updatePosition = useCallback(() => {
    if (typeof window === 'undefined') return;

    let x = 0;
    let y = 0;

    if (element?.current) {
      x = element.current.scrollLeft;
      y = element.current.scrollTop;
    } else if (useWindow) {
      x = window.pageXOffset || document.documentElement.scrollLeft;
      y = window.pageYOffset || document.documentElement.scrollTop;
    }

    const newPosition = {
      x: axis === 'y' ? position.x : x,
      y: axis === 'x' ? position.y : y,
    };

    setPosition(newPosition);
  }, [element, useWindow, axis, position.x, position.y]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const target = element?.current || window;

    // Set initial position
    updatePosition();

    target.addEventListener('scroll', updatePosition, { passive: true });

    return () => {
      target.removeEventListener('scroll', updatePosition);
    };
  }, [updatePosition]);

  return wait > 0 ? debouncedPosition : position;
}

/**
 * Hook for detecting scroll direction
 * @param options - Configuration options
 * @returns Object with scroll direction and position
 */
type ScrollDirection = 'up' | 'down' | 'left' | 'right' | null;

type UseScrollDirectionReturn = {
  scrollDirection: ScrollDirection;
  position: ScrollPosition;
};

export function useScrollDirection(
  options: UseScrollPositionOptions = {}
): UseScrollDirectionReturn {
  const position = useScrollPosition(options);
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>(null);
  const [lastPosition, setLastPosition] = useState<ScrollPosition>({ x: 0, y: 0 });

  useEffect(() => {
    const { x, y } = position;
    const { x: lastX, y: lastY } = lastPosition;

    let direction: ScrollDirection = null;

    if (y > lastY) {
      direction = 'down';
    } else if (y < lastY) {
      direction = 'up';
    } else if (x > lastX) {
      direction = 'right';
    } else if (x < lastX) {
      direction = 'left';
    }

    if (direction !== scrollDirection) {
      setScrollDirection(direction);
    }

    setLastPosition(position);
  }, [position, lastPosition, scrollDirection]);

  return { scrollDirection, position };
}

/**
 * Hook for detecting if user has scrolled to bottom
 * @param threshold - Distance from bottom to trigger (default: 100px)
 * @param options - Scroll position options
 * @returns Boolean indicating if near bottom
 */
export function useScrollToBottom(
  threshold: number = 100,
  options: UseScrollPositionOptions = {}
): boolean {
  const position = useScrollPosition(options);
  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkIfAtBottom = () => {
      const { element } = options;
      let scrollHeight: number;
      let clientHeight: number;
      let scrollTop: number;

      if (element?.current) {
        scrollHeight = element.current.scrollHeight;
        clientHeight = element.current.clientHeight;
        scrollTop = element.current.scrollTop;
      } else {
        scrollHeight = document.documentElement.scrollHeight;
        clientHeight = window.innerHeight;
        scrollTop = position.y;
      }

      const distanceFromBottom = scrollHeight - clientHeight - scrollTop;
      setIsAtBottom(distanceFromBottom <= threshold);
    };

    checkIfAtBottom();
  }, [position, threshold, options]);

  return isAtBottom;
}

/**
 * Hook for smooth scrolling to a position
 * @param options - Configuration options
 * @returns Function to scroll to position
 */
type ScrollToOptions = {
  top?: number;
  left?: number;
  behavior?: 'auto' | 'smooth';
};

export function useScrollTo(options: UseScrollPositionOptions = {}) {
  const scrollTo = useCallback(
    (scrollOptions: ScrollToOptions) => {
      if (typeof window === 'undefined') return;

      const { element } = options;
      const target = element?.current || window;

      if ('scrollTo' in target) {
        target.scrollTo({
          top: scrollOptions.top,
          left: scrollOptions.left,
          behavior: scrollOptions.behavior || 'smooth',
        });
      }
    },
    [options]
  );

  const scrollToTop = useCallback(
    (behavior: 'auto' | 'smooth' = 'smooth') => {
      scrollTo({ top: 0, behavior });
    },
    [scrollTo]
  );

  const scrollToBottom = useCallback(
    (behavior: 'auto' | 'smooth' = 'smooth') => {
      if (typeof window === 'undefined') return;

      const { element } = options;
      let scrollHeight: number;

      if (element?.current) {
        scrollHeight = element.current.scrollHeight;
      } else {
        scrollHeight = document.documentElement.scrollHeight;
      }

      scrollTo({ top: scrollHeight, behavior });
    },
    [scrollTo, options]
  );

  return { scrollTo, scrollToTop, scrollToBottom };
}

/**
 * Hook for hiding/showing elements based on scroll direction
 * Commonly used for hiding navigation bars when scrolling down
 * @param threshold - Minimum scroll distance to trigger hide/show
 * @param options - Scroll position options
 * @returns Boolean indicating if element should be visible
 */
export function useScrollHide(
  threshold: number = 10,
  options: UseScrollPositionOptions = {}
): boolean {
  const { scrollDirection, position } = useScrollDirection(options);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const currentScrollY = position.y;
    const scrollDifference = Math.abs(currentScrollY - lastScrollY);

    if (scrollDifference < threshold) return;

    if (scrollDirection === 'down' && currentScrollY > threshold) {
      setIsVisible(false);
    } else if (scrollDirection === 'up' || currentScrollY <= threshold) {
      setIsVisible(true);
    }

    setLastScrollY(currentScrollY);
  }, [scrollDirection, position.y, threshold, lastScrollY]);

  return isVisible;
}
