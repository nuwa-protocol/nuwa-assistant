'use client';

import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { AuthGuard } from '@/components/auth-guard';
import { useChatStore } from '@/lib/stores/chat-store';
import { useEffect, useState } from 'react';
import { generateId } from 'ai';

export default function Page() {
  const {
    currentSessionId,
    getSession,
    setCurrentSessionId,
    updateMessages,
  } = useChatStore();
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // render only based on currentSessionId, if not exist, create new
    if (!currentSessionId) {
      // no currentSessionId, create new
      const newId = generateId();
      updateMessages(newId, []);
      setCurrentSessionId(newId);
      setSession({ id: newId, messages: [], model: DEFAULT_CHAT_MODEL });
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
      updateMessages(currentSessionId, []);
      setSession({ id: currentSessionId, messages: [], model: DEFAULT_CHAT_MODEL });
      setIsLoading(false);
    }
  }, [currentSessionId, getSession, setCurrentSessionId, updateMessages]);

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="flex flex-col min-w-0 h-dvh bg-background">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Loading chat...</p>
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
        initialChatModel={session.model || DEFAULT_CHAT_MODEL}
        isReadonly={false}
      />
    </AuthGuard>
  );
}
