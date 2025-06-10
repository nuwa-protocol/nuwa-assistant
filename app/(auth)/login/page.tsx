'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDIDStore } from '@/lib/stores/did-store';
import { DIDLoginForm } from '@/components/did-login-form';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated } = useDIDStore();

  // 如果已经登录，重定向到首页
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  // 如果已经登录，不显示登录表单
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">DID Sign In</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Enter your DID to access the chat
          </p>
        </div>
        <DIDLoginForm />
      </div>
    </div>
  );
} 