"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "sepia";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

useEffect(() => {
  const stored = localStorage.getItem("theme") as "light" | "dark" | null;
  if (stored) {
    setThemeState(stored);
    document.body.classList.toggle("dark", stored === "dark");
  }
}, []);


useEffect(() => {
  document.body.classList.remove("light", "dark", "sepia");
  document.body.classList.add(theme);
  localStorage.setItem("theme", theme);
}, [theme]);
  const toggleTheme = () =>
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));

const setTheme = (theme: Theme) => setThemeState(theme);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
