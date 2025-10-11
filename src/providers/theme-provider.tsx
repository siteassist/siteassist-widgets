import { useEffect, useState } from "react";
import z from "zod";

import type { Theme } from "./theme-context";
import { ThemeContext } from "./theme-context";

export interface ThemeProviderProps {
  children: React.ReactNode;
  theme: Theme;
}

export default function ThemeProvider({
  children,
  theme: initalTheme,
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState(initalTheme);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const changeToSystemTheme = () => {
      const isDark = media.matches;
      setIsDark(isDark);
      root.classList[isDark ? "add" : "remove"]("dark");
    };

    if (theme === "auto") {
      changeToSystemTheme();
      media.addEventListener("change", changeToSystemTheme);
    } else {
      root.classList.add(theme);
      setIsDark(theme === "dark");
    }

    return () => {
      media.removeEventListener("change", changeToSystemTheme);
    };
  }, [theme]);

  useEffect(() => {
    const handleMessage = (
      event: MessageEvent<{ __SA?: { type: string; payload: unknown } }>,
    ) => {
      if (event.data.__SA) {
        const { type, payload } = event.data.__SA;
        switch (type) {
          case "changeTheme": {
            const { success, data } = z
              .enum(["auto", "light", "dark"])
              .safeParse(payload);
            if (success) {
              return setTheme(data);
            }
          }
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return (
    <ThemeContext.Provider
      {...props}
      value={{
        isDark,
        theme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
