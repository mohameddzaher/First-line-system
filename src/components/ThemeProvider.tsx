"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeValue {
  theme: Theme;
  /** What is actually rendered right now — "system" resolved against the OS. */
  resolved: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeProvider({
  initialTheme,
  children,
}: {
  initialTheme: Theme;
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [resolved, setResolved] = useState<"light" | "dark">(
    initialTheme === "system" ? "light" : initialTheme,
  );

  const apply = useCallback((next: Theme) => {
    const isDark = next === "dark" || (next === "system" && systemPrefersDark());
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
    setResolved(isDark ? "dark" : "light");
  }, []);

  const setTheme = useCallback(
    (next: Theme) => {
      setThemeState(next);
      document.cookie = `fl_theme=${next};path=/;max-age=31536000;samesite=lax`;
      apply(next);
    },
    [apply],
  );

  // Sync on mount (the inline script already painted; this reconciles state)
  // and keep following the OS while the user is on "system".
  useEffect(() => {
    apply(theme);
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme, apply]);

  const value = useMemo(() => ({ theme, resolved, setTheme }), [theme, resolved, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}

/**
 * Runs before first paint so a dark-mode user never sees a white flash.
 * Kept in sync with ThemeProvider's resolution logic above.
 */
export const themeScript = `
(function(){try{
  var m=document.cookie.match(/(?:^|;\\s*)fl_theme=([^;]*)/);
  var t=m?m[1]:'system';
  var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
  if(d){document.documentElement.classList.add('dark');}
  document.documentElement.style.colorScheme=d?'dark':'light';
}catch(e){}})();
`;
