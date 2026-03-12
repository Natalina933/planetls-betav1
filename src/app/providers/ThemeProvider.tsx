"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "sepia" | "art-deco" | "mucha-dark";
type LegacyTheme = "dark";

export const THEMES = {
  LIGHT: "light",
  SEPIA: "sepia",
  ART_DECO: "art-deco",
  MUCHA_DARK: "mucha-dark",
} as const;

export const THEME_LABELS: Record<Theme, string> = {
  light: "Mode clair",
  sepia: "Sepia 1900",
  "art-deco": "Art Deco",
  "mucha-dark": "Mucha Nocturne",
};

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  changeTheme: (theme: Theme) => void;
  themes: typeof THEMES;
  labels: typeof THEME_LABELS;
  getCurrentLabel: () => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  const applyTheme = (nextTheme: Theme) => {
    document.documentElement.setAttribute("data-theme", nextTheme);
    document.body.setAttribute("data-theme", nextTheme);
    document.body.classList.remove("light", "sepia", "art-deco", "mucha-dark");
    document.body.classList.add(nextTheme);
  };

  useEffect(() => {
    const storedRaw = localStorage.getItem("theme") as Theme | LegacyTheme | null;
    const stored =
      storedRaw === "dark" ? "mucha-dark" : storedRaw;

    if (stored === "light" || stored === "sepia" || stored === "art-deco" || stored === "mucha-dark") {
      setThemeState(stored);
      applyTheme(stored);
      return;
    }

    applyTheme("light");
  }, []);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setThemeState((prev) => (prev === "mucha-dark" ? "light" : "mucha-dark"));

  const setTheme = (nextTheme: Theme) => setThemeState(nextTheme);
  const changeTheme = (nextTheme: Theme) => setThemeState(nextTheme);
  const getCurrentLabel = () => THEME_LABELS[theme] ?? theme;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme,
        changeTheme,
        themes: THEMES,
        labels: THEME_LABELS,
        getCurrentLabel,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
