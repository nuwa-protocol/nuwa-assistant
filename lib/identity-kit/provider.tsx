'use client';

import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useIdentityKit as useIdentityKitInternal } from './useIdentityKit';
import { useDIDStore } from '@/lib/stores/did-store';

type IdentityKitValue = ReturnType<typeof useIdentityKitInternal>;

const IdentityKitContext = createContext<IdentityKitValue | null>(null);

export function IdentityKitProvider({ children }: { children: ReactNode }) {
  const identityKit = useIdentityKitInternal();
  const { setDid, logout } = useDIDStore();

  // Keep legacy DID store in sync so existing code relying on it continues to work.
  useEffect(() => {
    if (identityKit.state.isConnected && identityKit.state.agentDid) {
      try {
        setDid(identityKit.state.agentDid);
      } catch {
        // ignore validation error – we may relax regex later
      }
    } else if (!identityKit.state.isConnected) {
      logout();
    }
  }, [identityKit.state.isConnected, identityKit.state.agentDid, setDid, logout]);

  return (
    <IdentityKitContext.Provider value={identityKit}>
      {children}
    </IdentityKitContext.Provider>
  );
}

export function useIdentityKit() {
  const ctx = useContext(IdentityKitContext);
  if (!ctx) throw new Error('useIdentityKit must be used within IdentityKitProvider');
  return ctx;
} 