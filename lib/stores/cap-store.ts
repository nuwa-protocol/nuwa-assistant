import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Installed Cap interface (minimal data for locally installed caps)
export interface InstalledCap {
  id: string;
  name: string;
  tag: string;
  description: string;
  version: string;
  installDate: number;
  isEnabled?: boolean;
  settings?: Record<string, any>;
}

// Cap store state interface - only handles installed caps
interface CapStoreState {
  installedCaps: Record<string, InstalledCap>;

  // Installed cap management
  getInstalledCap: (id: string) => InstalledCap | null;
  getAllInstalledCaps: () => InstalledCap[];
  getInstalledCapsByCategory: (category: string) => InstalledCap[];

  // Cap actions
  installCap: (cap: Omit<InstalledCap, 'installDate' | 'isEnabled'>) => void;
  uninstallCap: (id: string) => void;
  isCapInstalled: (id: string) => boolean;

  // Cap state management
  enableCap: (id: string) => void;
  disableCap: (id: string) => void;
  isCapEnabled: (id: string) => boolean;
  updateCapSettings: (id: string, settings: Record<string, any>) => void;

  // Data management
  updateInstalledCap: (id: string, updates: Partial<InstalledCap>) => void;
  clearAllInstalledCaps: () => void;

  // Utility
  getInstalledCapCount: () => number;
  getInstalledCapsByInstallDate: () => InstalledCap[];
}

const isBrowser = typeof window !== 'undefined';

// Custom storage adapter with error handling
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

export const useCapStore = create<CapStoreState>()(
  persist(
    (set, get) => ({
      installedCaps: {},

      getInstalledCap: (id: string) => {
        const { installedCaps } = get();
        return installedCaps[id] || null;
      },

      getAllInstalledCaps: () => {
        const { installedCaps } = get();
        return Object.values(installedCaps).sort(
          (a, b) => b.installDate - a.installDate,
        );
      },

      getInstalledCapsByCategory: (category: string) => {
        const { installedCaps } = get();
        const allCaps = Object.values(installedCaps);

        if (category === 'all') {
          return allCaps.sort((a, b) => b.installDate - a.installDate);
        }

        return allCaps
          .filter((cap) => cap.tag === category)
          .sort((a, b) => b.installDate - a.installDate);
      },

      installCap: (cap: Omit<InstalledCap, 'installDate' | 'isEnabled'>) => {
        const { installedCaps } = get();

        // Don't install if already installed
        if (installedCaps[cap.id]) {
          return;
        }

        const newInstalledCap: InstalledCap = {
          ...cap,
          installDate: Date.now(),
          isEnabled: true,
          settings: {},
        };

        set((state) => ({
          installedCaps: {
            ...state.installedCaps,
            [cap.id]: newInstalledCap,
          },
        }));
      },

      uninstallCap: (id: string) => {
        set((state) => {
          const { [id]: removed, ...restCaps } = state.installedCaps;
          return {
            installedCaps: restCaps,
          };
        });
      },

      isCapInstalled: (id: string) => {
        const { installedCaps } = get();
        return id in installedCaps;
      },

      enableCap: (id: string) => {
        const { installedCaps } = get();
        const cap = installedCaps[id];

        if (!cap) return;

        set((state) => ({
          installedCaps: {
            ...state.installedCaps,
            [id]: { ...cap, isEnabled: true },
          },
        }));
      },

      disableCap: (id: string) => {
        const { installedCaps } = get();
        const cap = installedCaps[id];

        if (!cap) return;

        set((state) => ({
          installedCaps: {
            ...state.installedCaps,
            [id]: { ...cap, isEnabled: false },
          },
        }));
      },

      isCapEnabled: (id: string) => {
        const { installedCaps } = get();
        const cap = installedCaps[id];
        return cap?.isEnabled ?? false;
      },

      updateCapSettings: (id: string, settings: Record<string, any>) => {
        const { installedCaps } = get();
        const cap = installedCaps[id];

        if (!cap) return;

        set((state) => ({
          installedCaps: {
            ...state.installedCaps,
            [id]: {
              ...cap,
              settings: { ...cap.settings, ...settings },
            },
          },
        }));
      },

      updateInstalledCap: (id: string, updates: Partial<InstalledCap>) => {
        const { installedCaps } = get();
        const cap = installedCaps[id];

        if (!cap) return;

        set((state) => ({
          installedCaps: {
            ...state.installedCaps,
            [id]: { ...cap, ...updates },
          },
        }));
      },

      clearAllInstalledCaps: () => {
        set({
          installedCaps: {},
        });
      },

      getInstalledCapCount: () => {
        const { installedCaps } = get();
        return Object.keys(installedCaps).length;
      },

      getInstalledCapsByInstallDate: () => {
        const { installedCaps } = get();
        return Object.values(installedCaps).sort(
          (a, b) => b.installDate - a.installDate,
        );
      },
    }),
    {
      name: 'installed-caps-storage',
      storage: createJSONStorage(() => persistStorage),
      partialize: (state) => ({
        installedCaps: state.installedCaps,
      }),
    },
  ),
);
