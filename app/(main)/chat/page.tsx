'use client';

import { Chat } from '@/components/chat';
import { AuthGuard } from '@/components/auth-guard';
import { useChatStore } from '@/lib/stores/chat-store';
import { useEffect, useState } from 'react';
import { generateId } from 'ai';
import { useLocale } from '@/locales/use-locale';

export default function Page() {
  const { currentSessionId, getSession, setCurrentSessionId } = useChatStore();
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const { t } = useLocale();

  useEffect(() => {
    // render only based on currentSessionId, if not exist, create new
    if (!currentSessionId) {
      // no currentSessionId, create new
      const newId = generateId();
      setCurrentSessionId(newId);
      setSession({ id: newId, messages: [] });
      setIsLoading(false);
      return;
    }
    // if currentSessionId exists, find session
    const existingSession = getSession(currentSessionId);
    if (existingSession) {
      setSession(existingSession);
      setIsLoading(false);
    } else {
      // no corresponding session, create new
      setSession({ id: currentSessionId, messages: [] });
      setIsLoading(false);
    }
  }, [currentSessionId, getSession, setCurrentSessionId]);

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="flex flex-col min-w-0 h-dvh bg-background">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full size-8 border-b-2 border-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('chat.loadingChat')}</p>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <Chat
        id={session.id}
        initialMessages={session.messages}
        isReadonly={false}
      />
    </AuthGuard>
  );
}
