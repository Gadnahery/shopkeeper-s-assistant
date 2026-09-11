import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { flushSync } from "react-dom";

export type Theme = "light" | "dark";
export type ThemePreference = Theme | "system";

export type ToggleThemeEvent =
  | React.MouseEvent<HTMLElement>
  | MouseEvent
  | { clientX: number; clientY: number }
  | undefined;

type ThemeContextValue = {
  theme: Theme;
  preference: ThemePreference;
  setTheme: (t: ThemePreference, event?: ToggleThemeEvent) => void;
  toggleTheme: (event?: ToggleThemeEvent) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readInitialPreference(): ThemePreference {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem("app-theme");
  if (saved === "dark" || saved === "light" || saved === "system") return saved;
  return "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(readInitialPreference);
  const [systemTheme, setSystemTheme] = useState<Theme>(getSystemTheme);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => setSystemTheme(media.matches ? "dark" : "light");

    handleChange();
    media.addEventListener?.("change", handleChange);
    return () => media.removeEventListener?.("change", handleChange);
  }, []);

  const theme = useMemo<Theme>(
    () => (preference === "system" ? systemTheme : preference),
    [preference, systemTheme],
  );

  // Synchronize document classes and localStorage whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    try {
      localStorage.setItem("app-theme", preference);
    } catch {}
  }, [theme, preference]);

  const applyThemeChange = useCallback(
    (nextPreference: ThemePreference, event?: ToggleThemeEvent) => {
      const isReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

      const supportsViewTransition =
        typeof document !== "undefined" &&
        "startViewTransition" in document &&
        !isReducedMotion;

      const nextResolvedTheme: Theme =
        nextPreference === "system" ? getSystemTheme() : nextPreference;

      // Fallback for browsers without View Transitions API or when user prefers reduced motion
      if (!supportsViewTransition) {
        setPreference(nextPreference);
        const root = document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(nextResolvedTheme);
        try {
          localStorage.setItem("app-theme", nextPreference);
        } catch {}
        return;
      }

      // Calculate origin coordinates for circular ripple
      let x = typeof window !== "undefined" ? window.innerWidth / 2 : 0;
      let y = typeof window !== "undefined" ? window.innerHeight / 2 : 0;

      if (event) {
        if (
          "clientX" in event &&
          "clientY" in event &&
          typeof event.clientX === "number" &&
          typeof event.clientY === "number" &&
          (event.clientX !== 0 || event.clientY !== 0)
        ) {
          x = event.clientX;
          y = event.clientY;
        } else if ("currentTarget" in event && (event.currentTarget as HTMLElement)?.getBoundingClientRect) {
          const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
          x = rect.left + rect.width / 2;
          y = rect.top + rect.height / 2;
        }
      }

      // Calculate maximum distance to the furthest viewport corner
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      const transition = (document as any).startViewTransition(() => {
        // flushSync forces React to synchronously re-render with the new state
        // before the browser takes the snapshot of the "new" page
        flushSync(() => {
          setPreference(nextPreference);
        });
        const root = document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(nextResolvedTheme);
        try {
          localStorage.setItem("app-theme", nextPreference);
        } catch {}
      });

      transition.ready
        .then(() => {
          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration: 450,
              easing: "cubic-bezier(0.4, 0, 0.2, 1)",
              pseudoElement: "::view-transition-new(root)",
            }
          );
        })
        .catch(() => {
          // Transition was aborted or skipped
        });
    },
    []
  );

  const setTheme = useCallback(
    (next: ThemePreference, event?: ToggleThemeEvent) => {
      applyThemeChange(next, event);
    },
    [applyThemeChange]
  );

  const toggleTheme = useCallback(
    (event?: ToggleThemeEvent) => {
      const currentResolved = preference === "system" ? systemTheme : preference;
      const next: Theme = currentResolved === "light" ? "dark" : "light";
      applyThemeChange(next, event);
    },
    [preference, systemTheme, applyThemeChange]
  );

  return (
    <ThemeContext.Provider value={{ theme, preference, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
