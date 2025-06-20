'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDIDStore } from '@/lib/stores/did-store';
import { LoaderIcon } from './icons';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated } = useDIDStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
    setIsChecking(false);
  }, [isAuthenticated, router]);

  if (isChecking) {
    return (
      fallback || (
        <div className="flex h-dvh w-screen items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="animate-spin">
              <LoaderIcon />
            </div>
            <span>Checking authentication...</span>
          </div>
        </div>
      )
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
