import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { getLibrarySettings } from "@/services/settings.service";

type Theme = "light" | "dark";
type ThemePreference = Theme | "system";

const ThemeContext = createContext<{
  theme: Theme;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  toggle: () => void;
} | null>(null);

const STORAGE_KEY = "perpus-theme";

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

function resolveTheme(preference: ThemePreference): Theme {
  if (preference !== "system") return preference;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading: authLoading } = useAuth();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    if (authLoading) return;

    let active = true;
    const stored = window.localStorage.getItem(STORAGE_KEY);

    const loadPreference = async () => {
      let nextPreference: ThemePreference = isThemePreference(stored) ? stored : "system";

      if (!stored && isAdmin) {
        try {
          const settings = await getLibrarySettings();
          nextPreference = settings.default_theme;
        } catch {
          // Non-admin sessions cannot read the library-wide setting.
        }
      }

      if (active) setPreferenceState(nextPreference);
    };

    void loadPreference();
    return () => {
      active = false;
    };
  }, [authLoading, isAdmin]);

  useEffect(() => {
    const resolvedTheme = resolveTheme(preference);
    setTheme(resolvedTheme);
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
    window.localStorage.setItem(STORAGE_KEY, preference);
  }, [preference]);

  const setPreference = useCallback((nextPreference: ThemePreference) => {
    setPreferenceState(nextPreference);
    setTheme(resolveTheme(nextPreference));
  }, []);

  const toggle = useCallback(
    () => setPreference(theme === "dark" ? "light" : "dark"),
    [setPreference, theme],
  );

  return <ThemeContext.Provider value={{ theme, preference, setPreference, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme harus dipakai di dalam ThemeProvider");
  return ctx;
}
