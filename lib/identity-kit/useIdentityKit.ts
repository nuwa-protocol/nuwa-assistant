'use client';

import { useNuwaIdentityKit, type UseIdentityKitOptions } from '@nuwa-ai/identity-kit-web';

/**
 * Thin wrapper around identity-kit-web hook that injects sensible defaults for Nuwa Assistant.
 */
export const useIdentityKit = (options: UseIdentityKitOptions = {}) =>
  useNuwaIdentityKit({
    appName: 'Nuwa Assistant',
    cadopDomain:
      typeof window !== 'undefined'
        ? localStorage.getItem('cadop-domain') ?? 'https://test-id.nuwa.dev'
        : 'https://test-id.nuwa.dev',
    storage: 'local',
    autoConnect: false,
    ...options,
  }); 