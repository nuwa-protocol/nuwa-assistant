'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDIDStore } from '@/stores/did-store';

export function useAuthGuard() {
  const router = useRouter();
  const { isAuthenticated } = useDIDStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  return { isAuthenticated };
}

export function useRedirectIfAuthenticated() {
  const router = useRouter();
  const { isAuthenticated } = useDIDStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  return { isAuthenticated };
}
