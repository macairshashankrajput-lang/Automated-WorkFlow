import { useState, useEffect } from 'react';

export type AppTheme = 'dark' | 'midnight' | 'light' | 'cyberpunk';

const THEME_STORAGE_KEY = 'aw_studio_theme';

const themeConfigs: Record<AppTheme, Record<string, string>> = {
  dark: {
    '--bg-primary': '#020617', // slate-950
    '--bg-secondary': '#0f172a', // slate-900
    '--text-primary': '#f8fafc', // slate-50
    '--text-secondary': '#94a3b8', // slate-400
    '--border-color': '#1e293b', // slate-800
    '--accent-color': '#6366f1', // indigo-500
  },
  midnight: {
    '--bg-primary': '#030712', // gray-950
    '--bg-secondary': '#111827', // gray-900
    '--text-primary': '#f9fafb', // gray-50
    '--text-secondary': '#9ca3af', // gray-400
    '--border-color': '#1f2937', // gray-800
    '--accent-color': '#06b6d4', // cyan-500
  },
  light: {
    '--bg-primary': '#f8fafc', // slate-50
    '--bg-secondary': '#ffffff', // white
    '--text-primary': '#0f172a', // slate-900
    '--text-secondary': '#475569', // slate-600
    '--border-color': '#e2e8f0', // slate-200
    '--accent-color': '#4f46e5', // indigo-600
  },
  cyberpunk: {
    '--bg-primary': '#0d0221',
    '--bg-secondary': '#190a38',
    '--text-primary': '#f0f3f8',
    '--text-secondary': '#a892ee',
    '--border-color': '#2a115c',
    '--accent-color': '#f43f5e', // rose-500
  },
};

export function useTheme() {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved && (saved === 'dark' || saved === 'midnight' || saved === 'light' || saved === 'cyberpunk')) {
        return saved as AppTheme;
      }
    } catch {
      /* ignore storage errors */
    }
    return 'dark';
  });

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      /* ignore storage errors */
    }
  };

  useEffect(() => {
    const root = document.documentElement;

    // Toggle CSS classes on html root element
    root.classList.remove('dark', 'midnight', 'light', 'cyberpunk');
    root.classList.add(theme);
    root.setAttribute('data-theme', theme);

    // Apply CSS variables on root style
    const vars = themeConfigs[theme] || themeConfigs.dark;
    Object.entries(vars).forEach(([prop, val]) => {
      root.style.setProperty(prop, val);
    });
  }, [theme]);

  return { theme, setTheme };
}
