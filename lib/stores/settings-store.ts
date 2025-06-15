import { Locale } from '@/locales';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// settings interface
interface SettingsState {
  // language settings
  language: Locale;
  setLanguage: (lang: Locale) => void;

  // sidebar state
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // reset settings
  resetSettings: () => void;
}

const isBrowser = typeof window !== 'undefined';

const persistStorage = {
  getItem: (name: string): string | null => {
    if (!isBrowser) return null;
    try {
      return localStorage.getItem(name);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    if (!isBrowser) return;
    try {
      localStorage.setItem(name, value);
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },
  removeItem: (name: string): void => {
    if (!isBrowser) return;
    try {
      localStorage.removeItem(name);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      language: 'en',
      setLanguage: (lang: Locale) => set({ language: lang }),
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),
      resetSettings: () => {
        set({
          language: 'en',
          sidebarCollapsed: false,
        });
      },
    }),
    {
      name: 'user-settings-storage',
      storage: createJSONStorage(() => persistStorage),
      partialize: (state) => ({
        language: state.language,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);