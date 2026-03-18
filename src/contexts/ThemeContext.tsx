import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";

export type Theme = "light" | "dark";
export type ThemePreference = Theme | "system";

type ThemeContextValue = {
  theme: Theme;
  preference: ThemePreference;
  setTheme: (t: ThemePreference) => void;
  toggleTheme: () => void;
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
  const [systemTheme, setSystemTheme] = useState<Theme>("light");

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

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("theme-transition");
    const frameId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        root.classList.remove("light", "dark");
        root.classList.add(theme);
        localStorage.setItem("app-theme", preference);
      });
    });
    const timeoutId = setTimeout(() => root.classList.remove("theme-transition"), 500);
    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timeoutId);
    };
  }, [theme, preference]);

  const setTheme = useCallback((next: ThemePreference) => setPreference(next), []);
  const toggleTheme = useCallback(() => {
    setPreference((current) => {
      const resolved = current === "system" ? systemTheme : current;
      return resolved === "light" ? "dark" : "light";
    });
  }, [systemTheme]);

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
