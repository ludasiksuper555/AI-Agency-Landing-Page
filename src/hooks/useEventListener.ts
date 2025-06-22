import { useCallback, useEffect, useRef } from 'react';

import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';

type EventMap = {
  // Window Events
  resize: WindowEventMap['resize'];
  scroll: WindowEventMap['scroll'];
  load: WindowEventMap['load'];
  beforeunload: WindowEventMap['beforeunload'];
  unload: WindowEventMap['unload'];
  online: WindowEventMap['online'];
  offline: WindowEventMap['offline'];
  popstate: WindowEventMap['popstate'];
  hashchange: WindowEventMap['hashchange'];

  // Document Events
  DOMContentLoaded: DocumentEventMap['DOMContentLoaded'];
  visibilitychange: DocumentEventMap['visibilitychange'];

  // Element Events
  click: MouseEvent;
  mousedown: MouseEvent;
  mouseup: MouseEvent;
  mousemove: MouseEvent;
  mouseenter: MouseEvent;
  mouseleave: MouseEvent;
  mouseover: MouseEvent;
  mouseout: MouseEvent;
  keydown: KeyboardEvent;
  keyup: KeyboardEvent;
  keypress: KeyboardEvent;
  touchstart: TouchEvent;
  touchend: TouchEvent;
  touchmove: TouchEvent;
  touchcancel: TouchEvent;
  wheel: WheelEvent;
  contextmenu: MouseEvent;
  dblclick: MouseEvent;
  drag: DragEvent;
  dragend: DragEvent;
  dragenter: DragEvent;
  dragleave: DragEvent;
  dragover: DragEvent;
  dragstart: DragEvent;
  drop: DragEvent;
  input: Event;
  change: Event;
  submit: Event;
  reset: Event;
  focus: FocusEvent;
  blur: FocusEvent;
  focusin: FocusEvent;
  focusout: FocusEvent;
};

/**
 * Custom hook for adding event listeners
 * @param eventName - Name of the event
 * @param handler - Event handler function
 * @param element - Element to attach listener to (defaults to window)
 * @param options - Event listener options
 */
export function useEventListener<
  K extends keyof EventMap,
  T extends HTMLElement | Document | Window = Window,
>(
  eventName: K,
  handler: (event: EventMap[K]) => void,
  element?: React.RefObject<T> | T | null,
  options?: boolean | AddEventListenerOptions
) {
  // Create a ref that stores handler
  const savedHandler = useRef(handler);

  // Update ref.current value if handler changes
  useIsomorphicLayoutEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    // Define the listening target
    const targetElement = element?.hasOwnProperty('current')
      ? (element as React.RefObject<T>).current
      : (element ?? window);

    if (!targetElement || !('addEventListener' in targetElement)) {
      return;
    }

    // Create event listener that calls handler function stored in ref
    const eventListener: typeof handler = event => {
      savedHandler.current(event);
    };

    targetElement.addEventListener(eventName, eventListener as EventListener, options);

    // Remove event listener on cleanup
    return () => {
      targetElement.removeEventListener(eventName, eventListener as EventListener, options);
    };
  }, [eventName, element, options]);
}

/**
 * Hook for handling window resize events
 * @param handler - Resize handler function
 * @param options - Event listener options
 */
export function useWindowResize(
  handler: (event: Event) => void,
  options?: boolean | AddEventListenerOptions
) {
  useEventListener('resize', handler, window, options);
}

/**
 * Hook for handling window scroll events
 * @param handler - Scroll handler function
 * @param options - Event listener options
 */
export function useWindowScroll(
  handler: (event: Event) => void,
  options?: boolean | AddEventListenerOptions
) {
  useEventListener('scroll', handler, window, options);
}

/**
 * Hook for handling document visibility change
 * @param handler - Visibility change handler function
 * @param options - Event listener options
 */
export function useVisibilityChange(
  handler: (event: Event) => void,
  options?: boolean | AddEventListenerOptions
) {
  useEventListener('visibilitychange', handler, document, options);
}

/**
 * Hook for handling online/offline status
 * @param onOnline - Handler for when going online
 * @param onOffline - Handler for when going offline
 * @param options - Event listener options
 */
export function useNetworkStatus(
  onOnline?: () => void,
  onOffline?: () => void,
  options?: boolean | AddEventListenerOptions
) {
  useEventListener('online', onOnline || (() => {}), window, options);
  useEventListener('offline', onOffline || (() => {}), window, options);
}

/**
 * Hook for handling beforeunload event (page refresh/close)
 * @param handler - Handler function
 * @param enabled - Whether the listener is enabled
 */
export function useBeforeUnload(
  handler: (event: BeforeUnloadEvent) => void,
  enabled: boolean = true
) {
  const handlerRef = useRef(handler);

  useIsomorphicLayoutEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;

    const eventListener = (event: BeforeUnloadEvent) => {
      handlerRef.current(event);
    };

    window.addEventListener('beforeunload', eventListener);

    return () => {
      window.removeEventListener('beforeunload', eventListener);
    };
  }, [enabled]);
}

/**
 * Hook for handling multiple event listeners on the same element
 * @param events - Object with event names as keys and handlers as values
 * @param element - Element to attach listeners to
 * @param options - Event listener options
 */
export function useMultipleEventListeners<T extends HTMLElement | Document | Window = Window>(
  events: Partial<Record<keyof EventMap, (event: any) => void>>,
  element?: React.RefObject<T> | T | null,
  options?: boolean | AddEventListenerOptions
) {
  const savedEvents = useRef(events);

  useIsomorphicLayoutEffect(() => {
    savedEvents.current = events;
  }, [events]);

  useEffect(() => {
    const targetElement = element?.hasOwnProperty('current')
      ? (element as React.RefObject<T>).current
      : (element ?? window);

    if (!targetElement || !('addEventListener' in targetElement)) {
      return;
    }

    const eventListeners: Array<[string, EventListener]> = [];

    Object.entries(savedEvents.current).forEach(([eventName, handler]) => {
      if (handler) {
        const eventListener = (event: Event) => {
          savedEvents.current[eventName as keyof EventMap]?.(event);
        };

        targetElement.addEventListener(eventName, eventListener, options);
        eventListeners.push([eventName, eventListener]);
      }
    });

    return () => {
      eventListeners.forEach(([eventName, eventListener]) => {
        targetElement.removeEventListener(eventName, eventListener, options);
      });
    };
  }, [element, options]);
}

/**
 * Hook for handling keyboard shortcuts globally
 * @param shortcuts - Object with key combinations and their handlers
 * @param options - Event listener options
 */
type KeyboardShortcut = {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: (event: KeyboardEvent) => void;
};

export function useGlobalKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options?: boolean | AddEventListenerOptions
) {
  const shortcutsRef = useRef(shortcuts);

  useIsomorphicLayoutEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEventListener(
    'keydown',
    useCallback((event: KeyboardEvent) => {
      shortcutsRef.current.forEach(({ key, ctrl, shift, alt, meta, handler }) => {
        const isMatch =
          event.key.toLowerCase() === key.toLowerCase() &&
          !!event.ctrlKey === !!ctrl &&
          !!event.shiftKey === !!shift &&
          !!event.altKey === !!alt &&
          !!event.metaKey === !!meta;

        if (isMatch) {
          event.preventDefault();
          handler(event);
        }
      });
    }, []),
    window,
    options
  );
}
