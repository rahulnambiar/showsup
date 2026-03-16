"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read stored preference or system preference
    const stored = localStorage.getItem("theme") as Theme | null;
    const system = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    const resolved = stored ?? system;
    setTheme(resolved);
    applyTheme(resolved);
    setMounted(true);
  }, []);

  function applyTheme(t: Theme) {
    const html = document.documentElement;
    html.classList.remove("dark", "light");
    html.classList.add(t);
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    localStorage.setItem("theme", next);
    try {
      // Dynamic import to avoid including posthog in SSR
      import("@/lib/posthog").then(({ posthog }) =>
        posthog.capture("theme_changed", { theme: next })
      );
    } catch { /* ignore */ }
  }

  // Prevent flash — don't render children until theme applied
  if (!mounted) {
    return (
      <div style={{ visibility: "hidden" }}>
        {children}
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
