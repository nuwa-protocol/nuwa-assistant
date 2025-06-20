'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIdentityKit } from '@/lib/identity-kit/provider';

export function useAuthGuard() {
  const router = useRouter();
  const { state } = useIdentityKit();
  const isAuthenticated = state.isConnected;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  return { isAuthenticated };
}

export function useRedirectIfAuthenticated() {
  const router = useRouter();
  const { state } = useIdentityKit();
  const isAuthenticated = state.isConnected;

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  return { isAuthenticated };
} 