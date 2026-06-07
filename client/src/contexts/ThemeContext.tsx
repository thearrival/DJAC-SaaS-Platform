import React, { useEffect, useState } from "react";
import { ThemeContext, type Theme } from "./themeStore";

const THEME_STORAGE_KEY = "theme";
const THEME_MODE_STORAGE_KEY = "theme-mode";
type ThemeMode = "auto" | "manual";

function parseStoredTheme(value: string | null): Theme | null {
  if (value === "light" || value === "dark") {
    return value;
  }
  return null;
}

function parseStoredMode(value: string | null): ThemeMode {
  return value === "manual" ? "manual" : "auto";
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (switchable && typeof window !== "undefined") {
      return parseStoredMode(window.localStorage.getItem(THEME_MODE_STORAGE_KEY));
    }
    return "auto";
  });

  const [theme, setTheme] = useState<Theme>(() => {
    if (switchable && typeof window !== "undefined") {
      const storedTheme = parseStoredTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
      const storedMode = parseStoredMode(window.localStorage.getItem(THEME_MODE_STORAGE_KEY));
      if (storedTheme && storedMode === "manual") {
        return storedTheme;
      }
    }
    return defaultTheme;
  });

  useEffect(() => {
    if (!switchable) {
      setThemeMode("auto");
      setTheme(defaultTheme);
      return;
    }

    if (themeMode === "auto") {
      setTheme(defaultTheme);
    }
  }, [defaultTheme, switchable, themeMode]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    root.style.colorScheme = theme;

    if (switchable) {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      localStorage.setItem(THEME_MODE_STORAGE_KEY, themeMode);
    }
  }, [theme, switchable, themeMode]);

  const toggleTheme = switchable
    ? () => {
      setThemeMode("manual");
      setTheme(prev => (prev === "light" ? "dark" : "light"));
    }
    : undefined;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}
