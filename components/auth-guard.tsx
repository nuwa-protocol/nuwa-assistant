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
    // 给 zustand 一点时间从 localStorage 恢复状态
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        router.push('/login');
      }
      setIsChecking(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, router]);

  // 显示加载状态
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

  // 如果未认证，不渲染子组件（已经重定向到登录页）
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
} 