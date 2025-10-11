import { createContext, useContext } from "react";

export const ThemeContext = createContext<ThemeProviderState | null>(null);

export type Theme = "dark" | "light" | "auto";

export interface ThemeProviderState {
  isDark: boolean;
  theme?: Theme;
}

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};
