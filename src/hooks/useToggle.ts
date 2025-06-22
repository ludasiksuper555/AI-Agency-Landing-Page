import { useCallback, useState } from 'react';

/**
 * Custom hook for toggling boolean values
 * @param initialValue - Initial boolean value (default: false)
 * @returns Array with [value, toggle, setTrue, setFalse]
 */
export function useToggle(
  initialValue: boolean = false
): [boolean, () => void, () => void, () => void] {
  const [value, setValue] = useState<boolean>(initialValue);

  const toggle = useCallback(() => {
    setValue(prev => !prev);
  }, []);

  const setTrue = useCallback(() => {
    setValue(true);
  }, []);

  const setFalse = useCallback(() => {
    setValue(false);
  }, []);

  return [value, toggle, setTrue, setFalse];
}

/**
 * Hook for toggling with custom values
 * @param valueA - First value
 * @param valueB - Second value
 * @param initialValue - Initial value (defaults to valueA)
 * @returns Array with [value, toggle, setValueA, setValueB]
 */
export function useToggleValue<T>(
  valueA: T,
  valueB: T,
  initialValue?: T
): [T, () => void, () => void, () => void] {
  const [value, setValue] = useState<T>(initialValue ?? valueA);

  const toggle = useCallback(() => {
    setValue(prev => (prev === valueA ? valueB : valueA));
  }, [valueA, valueB]);

  const setValueA = useCallback(() => {
    setValue(valueA);
  }, [valueA]);

  const setValueB = useCallback(() => {
    setValue(valueB);
  }, [valueB]);

  return [value, toggle, setValueA, setValueB];
}

/**
 * Hook for managing multiple toggles
 * @param initialToggles - Object with initial toggle states
 * @returns Object with toggle states and functions
 */
export function useMultipleToggles<T extends Record<string, boolean>>(initialToggles: T) {
  const [toggles, setToggles] = useState<T>(initialToggles);

  const toggle = useCallback((key: keyof T) => {
    setToggles(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const setToggle = useCallback((key: keyof T, value: boolean) => {
    setToggles(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const setAllTrue = useCallback(() => {
    setToggles(prev => {
      const newToggles = { ...prev };
      Object.keys(newToggles).forEach(key => {
        newToggles[key as keyof T] = true as T[keyof T];
      });
      return newToggles;
    });
  }, []);

  const setAllFalse = useCallback(() => {
    setToggles(prev => {
      const newToggles = { ...prev };
      Object.keys(newToggles).forEach(key => {
        newToggles[key as keyof T] = false as T[keyof T];
      });
      return newToggles;
    });
  }, []);

  const resetToggles = useCallback(() => {
    setToggles(initialToggles);
  }, [initialToggles]);

  return {
    toggles,
    toggle,
    setToggle,
    setAllTrue,
    setAllFalse,
    resetToggles,
  };
}

/**
 * Hook for toggle with persistence in localStorage
 * @param key - localStorage key
 * @param initialValue - Initial value if not in localStorage
 * @returns Array with [value, toggle, setTrue, setFalse]
 */
export function usePersistedToggle(
  key: string,
  initialValue: boolean = false
): [boolean, () => void, () => void, () => void] {
  const [value, setValue] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const updateValue = useCallback(
    (newValue: boolean) => {
      setValue(newValue);
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(key, JSON.stringify(newValue));
        } catch (error) {
          console.warn(`Error setting localStorage key "${key}":`, error);
        }
      }
    },
    [key]
  );

  const toggle = useCallback(() => {
    updateValue(!value);
  }, [value, updateValue]);

  const setTrue = useCallback(() => {
    updateValue(true);
  }, [updateValue]);

  const setFalse = useCallback(() => {
    updateValue(false);
  }, [updateValue]);

  return [value, toggle, setTrue, setFalse];
}
