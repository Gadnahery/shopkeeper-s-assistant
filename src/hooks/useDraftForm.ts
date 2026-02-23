import { useState, useEffect, useCallback, useRef } from "react";

const DRAFT_PREFIX = "app-draft-";

/**
 * Persists form state to localStorage as a draft. Restores on mount and clears on successful submit.
 * Use for add/edit forms so data isn't lost when the user leaves or refreshes.
 */
export function useDraftForm<T extends Record<string, unknown>>(
  key: string,
  initialValue: T,
  options?: { debounceMs?: number; enabled?: boolean }
): [T, React.Dispatch<React.SetStateAction<T>>, () => void] {
  const storageKey = `${DRAFT_PREFIX}${key}`;
  const debounceMs = options?.debounceMs ?? 400;
  const enabled = options?.enabled ?? true;

  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined" || !enabled) return initialValue;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return initialValue;
      const parsed = JSON.parse(raw) as Partial<T>;
      if (parsed && typeof parsed === "object") {
        return { ...initialValue, ...parsed } as T;
      }
    } catch {
      // ignore
    }
    return initialValue;
  });

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;
    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(state));
      } catch {
        // quota or disabled
      }
    }, debounceMs);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [state, storageKey, debounceMs, enabled]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
    setState(initialValue);
  }, [storageKey, initialValue]);

  return [state, setState, clearDraft];
}
