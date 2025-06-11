'use client';

import { AuthGuard } from '@/components/auth-guard';
import { useChatStore } from '@/lib/stores/chat-store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Page() {
  const { createSession, sessions } = useChatStore();
  const router = useRouter();

  useEffect(() => {
    // 将 sessions 对象转换为排序后的数组
    const sortedSessions = Object.values(sessions).sort(
      (a, b) => b.updatedAt - a.updatedAt,
    );
    
    if (sortedSessions.length > 0) {
      const latest = sortedSessions[0];
      if (latest.messages.length === 0) {
        // if recent session is empty, redirect to it
        router.replace(`/chat/${latest.id}`);
        return;
      }
    }
    // if no empty session, create a new one
    const newSessionId = createSession();
    router.replace(`/chat/${newSessionId}`);
  }, [createSession, sessions, router]);

  return (
    <AuthGuard>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Creating new chat...</p>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
