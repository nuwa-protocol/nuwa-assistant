import type { Locale } from '@/locales';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// user settings interface
interface UserSettings {
  language: Locale;
  name: string;
  avatar: string | null;
}

// settings interface
interface SettingsState {
  // grouped user settings
  settings: UserSettings;
  setSettings: (settings: UserSettings) => void;
  setSetting: <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ) => void;

  // sidebar state
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  sidebarMode: 'pinned' | 'floating';
  setSidebarMode: (mode: 'pinned' | 'floating') => void;

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
      settings: {
        language: 'en',
        name: '',
        avatar: null,
      },
      setSettings: (settings: UserSettings) => set({ settings }),
      setSetting: (key, value) =>
        set((state) => ({
          settings: {
            ...state.settings,
            [key]: value,
          },
        })),
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed: boolean) =>
        set({ sidebarCollapsed: collapsed }),
      sidebarMode: 'pinned',
      setSidebarMode: (mode: 'pinned' | 'floating') =>
        set({ sidebarMode: mode }),
      resetSettings: () => {
        set({
          settings: {
            language: 'en',
            name: '',
            avatar: null,
          },
          sidebarCollapsed: false,
          sidebarMode: 'pinned',
        });
      },
    }),
    {
      name: 'user-settings-storage',
      storage: createJSONStorage(() => persistStorage),
      partialize: (state) => ({
        settings: state.settings,
        sidebarCollapsed: state.sidebarCollapsed,
        sidebarMode: state.sidebarMode,
      }),
    },
  ),
);
