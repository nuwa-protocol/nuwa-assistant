'use client';

import { Chat } from '@/components/chat';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { AuthGuard } from '@/components/auth-guard';
import { useChatStore } from '@/lib/stores/chat-store';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';

export default function Page(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const { getSession, setCurrentSession, createSession } = useChatStore();
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const loadSession = () => {
      try {
        // 尝试从存储中获取会话
        const existingSession = getSession(params.id);
        
        if (existingSession) {
          setSession(existingSession);
          setCurrentSession(params.id);
        } else {
          // 如果会话不存在，创建新会话并重定向
          const newId = createSession();
          router.replace(`/chat/${newId}`);
          return;
        }
      } catch (error) {
        console.error('Error loading session:', error);
        // 发生错误时创建新会话
        const newId = createSession();
        router.replace(`/chat/${newId}`);
        return;
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, [params.id, getSession, setCurrentSession, createSession, router]);

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

  if (!session) {
    return (
      <AuthGuard>
        <div className="flex flex-col min-w-0 h-dvh bg-background">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">Chat not found</p>
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
        autoResume={false}
      />
      <DataStreamHandler id={session.id} />
    </AuthGuard>
  );
}
