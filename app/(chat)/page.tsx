'use client';

import { AuthGuard } from '@/components/auth-guard';
import { useChatStore } from '@/lib/stores/chat-store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Page() {
  const { createSession, getSortedSessions } = useChatStore();
  const router = useRouter();

  useEffect(() => {
    const sessions = getSortedSessions();
    if (sessions.length > 0) {
      const latest = sessions[0];
      if (latest.messages.length === 0) {
        // if recent session is empty, redirect to it
        router.replace(`/chat/${latest.id}`);
        return;
      }
    }
    // if no empty session, create a new one
    const newSessionId = createSession();
    router.replace(`/chat/${newSessionId}`);
  }, [createSession, getSortedSessions, router]);

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
