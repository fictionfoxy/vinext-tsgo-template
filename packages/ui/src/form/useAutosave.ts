import { useEffect, useRef } from 'react';

export type UseAutosaveOptions<T> = {
  values: T;
  isDirty: boolean;
  isValid: boolean;
  onSave: (values: T) => Promise<void> | void;
  /** Debounce delay in ms. Defaults to 500. */
  delay?: number;
};

/**
 * Watches form values and auto-saves after a debounce window,
 * but only when the form is both dirty and valid.
 * Prevents saving invalid intermediate states or racing multiple writes.
 */
export function useAutosave<T>({
  values,
  isDirty,
  isValid,
  onSave,
  delay = 500,
}: UseAutosaveOptions<T>): void {
  const saveRef = useRef(onSave);
  const inFlightRef = useRef(false);

  // Keep the save callback ref current so stale closures never fire old logic.
  useEffect(() => {
    saveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    if (!isDirty || !isValid) return;

    const timer = setTimeout(async () => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        await saveRef.current(values);
      } finally {
        inFlightRef.current = false;
      }
    }, delay);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, isDirty, isValid, delay]);
}
