import { useEffect, useRef } from 'react';

type Handler = (event: MouseEvent | TouchEvent) => void;

/**
 * Custom hook that handles clicks outside of a specified element
 * @param handler - Function to call when click outside occurs
 * @param mouseEvent - Mouse event type to listen for (default: 'mousedown')
 * @param touchEvent - Touch event type to listen for (default: 'touchstart')
 * @returns Ref to attach to the element
 */
export function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  handler: Handler,
  mouseEvent: 'mousedown' | 'mouseup' = 'mousedown',
  touchEvent: 'touchstart' | 'touchend' = 'touchstart'
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref?.current;

      // Do nothing if clicking ref's element or descendent elements
      if (!el || el.contains(event.target as Node)) {
        return;
      }

      handler(event);
    };

    document.addEventListener(mouseEvent, listener);
    document.addEventListener(touchEvent, listener);

    return () => {
      document.removeEventListener(mouseEvent, listener);
      document.removeEventListener(touchEvent, listener);
    };
  }, [ref, handler, mouseEvent, touchEvent]);

  return ref;
}

/**
 * Alternative version that accepts multiple refs
 * @param refs - Array of refs to check
 * @param handler - Function to call when click outside occurs
 * @param mouseEvent - Mouse event type to listen for
 * @param touchEvent - Touch event type to listen for
 */
export function useOnClickOutsideMultiple<T extends HTMLElement = HTMLElement>(
  refs: React.RefObject<T>[],
  handler: Handler,
  mouseEvent: 'mousedown' | 'mouseup' = 'mousedown',
  touchEvent: 'touchstart' | 'touchend' = 'touchstart'
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      // Check if the click is inside any of the refs
      const isInsideAnyRef = refs.some(ref => {
        const el = ref?.current;
        return el && el.contains(event.target as Node);
      });

      // If click is outside all refs, call handler
      if (!isInsideAnyRef) {
        handler(event);
      }
    };

    document.addEventListener(mouseEvent, listener);
    document.addEventListener(touchEvent, listener);

    return () => {
      document.removeEventListener(mouseEvent, listener);
      document.removeEventListener(touchEvent, listener);
    };
  }, [refs, handler, mouseEvent, touchEvent]);
}

/**
 * Hook that provides both ref and handler for click outside
 * Useful when you need to conditionally enable/disable the behavior
 * @param enabled - Whether the hook should be active
 * @param mouseEvent - Mouse event type to listen for
 * @param touchEvent - Touch event type to listen for
 * @returns Object with ref and setHandler function
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  enabled: boolean = true,
  mouseEvent: 'mousedown' | 'mouseup' = 'mousedown',
  touchEvent: 'touchstart' | 'touchend' = 'touchstart'
) {
  const ref = useRef<T>(null);
  const handlerRef = useRef<Handler | null>(null);

  const setHandler = (handler: Handler | null) => {
    handlerRef.current = handler;
  };

  useEffect(() => {
    if (!enabled) return;

    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref?.current;
      const handler = handlerRef.current;

      if (!el || !handler || el.contains(event.target as Node)) {
        return;
      }

      handler(event);
    };

    document.addEventListener(mouseEvent, listener);
    document.addEventListener(touchEvent, listener);

    return () => {
      document.removeEventListener(mouseEvent, listener);
      document.removeEventListener(touchEvent, listener);
    };
  }, [enabled, mouseEvent, touchEvent]);

  return { ref, setHandler };
}
