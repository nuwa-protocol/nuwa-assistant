'use client';

import { AuthGuard } from '@/components/auth-guard';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useLocale } from '@/locales/use-locale';

export default function Page() {
  const router = useRouter();
  const { t } = useLocale();

  useEffect(() => {
    // redirect to /chat
    router.replace('/chat');
  }, [router]);

  return (
    <AuthGuard>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full size-8 border-b-2 border-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('chat.loading')}</p>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
