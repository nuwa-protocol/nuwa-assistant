import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DIDState {
  did: string | null;
  isAuthenticated: boolean;
  setDid: (did: string) => void;
  logout: () => void;
  validateDidFormat: (did: string) => boolean;
}

export const useDIDStore = create<DIDState>()(
  persist(
    (set, get) => ({
      did: null,
      isAuthenticated: false,

      validateDidFormat: (did: string): boolean => {
        const didRegex = /^did:nuwa:[a-zA-Z0-9_-]+$/;
        return didRegex.test(did);
      },

      setDid: (did: string) => {
        const { validateDidFormat } = get();
        if (validateDidFormat(did)) {
          set({ 
            did, 
            isAuthenticated: true 
          });
        } else {
          throw new Error('Invalid DID format. Expected: did:nuwa:username');
        }
      },

      logout: () => {
        set({ 
          did: null, 
          isAuthenticated: false 
        });
      },
    }),
    {
      name: 'user-did-storage', // localStorage key
      partialize: (state) => ({ 
        did: state.did, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
); 