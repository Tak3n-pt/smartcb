// Theme Store

import { create } from 'zustand';
import { ColorTheme } from '../theme';

interface ThemeStore {
  theme: ColorTheme;
  toggleTheme: () => void;
  setTheme: (theme: ColorTheme) => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: 'dark', // Default to dark mode

  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'dark' ? 'light' : 'dark',
    })),

  setTheme: (theme) =>
    set({ theme }),
}));