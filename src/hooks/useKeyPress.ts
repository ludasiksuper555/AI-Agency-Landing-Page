import { useCallback, useEffect, useState } from 'react';

type KeyPressOptions = {
  target?: EventTarget;
  event?: 'keydown' | 'keyup';
  preventDefault?: boolean;
  stopPropagation?: boolean;
};

/**
 * Custom hook for detecting key presses
 * @param targetKey - The key to listen for (e.g., 'Enter', 'Escape', 'ArrowUp')
 * @param options - Configuration options
 * @returns Boolean indicating if the key is currently pressed
 */
export function useKeyPress(targetKey: string | string[], options: KeyPressOptions = {}): boolean {
  const {
    target = typeof window !== 'undefined' ? window : null,
    event = 'keydown',
    preventDefault = false,
    stopPropagation = false,
  } = options;

  const [keyPressed, setKeyPressed] = useState<boolean>(false);

  const downHandler = useCallback(
    (e: KeyboardEvent) => {
      const keys = Array.isArray(targetKey) ? targetKey : [targetKey];

      if (keys.includes(e.key)) {
        if (preventDefault) e.preventDefault();
        if (stopPropagation) e.stopPropagation();
        setKeyPressed(true);
      }
    },
    [targetKey, preventDefault, stopPropagation]
  );

  const upHandler = useCallback(
    (e: KeyboardEvent) => {
      const keys = Array.isArray(targetKey) ? targetKey : [targetKey];

      if (keys.includes(e.key)) {
        setKeyPressed(false);
      }
    },
    [targetKey]
  );

  useEffect(() => {
    if (!target) return;

    if (event === 'keydown') {
      target.addEventListener('keydown', downHandler as EventListener);
      target.addEventListener('keyup', upHandler as EventListener);
    } else {
      target.addEventListener('keyup', downHandler as EventListener);
    }

    return () => {
      if (event === 'keydown') {
        target.removeEventListener('keydown', downHandler as EventListener);
        target.removeEventListener('keyup', upHandler as EventListener);
      } else {
        target.removeEventListener('keyup', downHandler as EventListener);
      }
    };
  }, [target, event, downHandler, upHandler]);

  return keyPressed;
}

/**
 * Hook for handling keyboard shortcuts with modifier keys
 * @param keys - Object with modifier keys and main key
 * @param callback - Function to call when shortcut is pressed
 * @param options - Configuration options
 */
type ShortcutKeys = {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean; // Cmd on Mac, Windows key on PC
};

export function useKeyboardShortcut(
  keys: ShortcutKeys,
  callback: (e: KeyboardEvent) => void,
  options: Omit<KeyPressOptions, 'event'> = {}
) {
  const {
    target = typeof window !== 'undefined' ? window : null,
    preventDefault = true,
    stopPropagation = true,
  } = options;

  useEffect(() => {
    if (!target) return;

    const handler = (e: KeyboardEvent) => {
      const { key, ctrl = false, shift = false, alt = false, meta = false } = keys;

      const isMatch =
        e.key.toLowerCase() === key.toLowerCase() &&
        e.ctrlKey === ctrl &&
        e.shiftKey === shift &&
        e.altKey === alt &&
        e.metaKey === meta;

      if (isMatch) {
        if (preventDefault) e.preventDefault();
        if (stopPropagation) e.stopPropagation();
        callback(e);
      }
    };

    target.addEventListener('keydown', handler as EventListener);

    return () => {
      target.removeEventListener('keydown', handler as EventListener);
    };
  }, [keys, callback, target, preventDefault, stopPropagation]);
}

/**
 * Hook for handling multiple keyboard shortcuts
 * @param shortcuts - Array of shortcut configurations
 * @param options - Configuration options
 */
type ShortcutConfig = ShortcutKeys & {
  callback: (e: KeyboardEvent) => void;
  description?: string;
};

export function useKeyboardShortcuts(
  shortcuts: ShortcutConfig[],
  options: Omit<KeyPressOptions, 'event'> = {}
) {
  const {
    target = typeof window !== 'undefined' ? window : null,
    preventDefault = true,
    stopPropagation = true,
  } = options;

  useEffect(() => {
    if (!target) return;

    const handler = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const { key, ctrl = false, shift = false, alt = false, meta = false, callback } = shortcut;

        const isMatch =
          e.key.toLowerCase() === key.toLowerCase() &&
          e.ctrlKey === ctrl &&
          e.shiftKey === shift &&
          e.altKey === alt &&
          e.metaKey === meta;

        if (isMatch) {
          if (preventDefault) e.preventDefault();
          if (stopPropagation) e.stopPropagation();
          callback(e);
          break; // Stop checking other shortcuts
        }
      }
    };

    target.addEventListener('keydown', handler as EventListener);

    return () => {
      target.removeEventListener('keydown', handler as EventListener);
    };
  }, [shortcuts, target, preventDefault, stopPropagation]);
}

/**
 * Common keyboard shortcuts
 */
export const KEYBOARD_SHORTCUTS = {
  ESCAPE: 'Escape',
  ENTER: 'Enter',
  SPACE: ' ',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  BACKSPACE: 'Backspace',
  DELETE: 'Delete',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
} as const;
