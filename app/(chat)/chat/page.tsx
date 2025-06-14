'use client';

import { Chat } from '@/components/chat';
import { AuthGuard } from '@/components/auth-guard';
import { useEffect, useState } from 'react';
import { generateUUID } from '@/lib/utils';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { useChatStore } from '@/lib/stores/chat-store';

export default function ChatPage() {
  const [tempSessionId] = useState(() => generateUUID());
  const { setCurrentSession } = useChatStore();
  
  useEffect(() => {
    setCurrentSession(tempSessionId);
  }, [tempSessionId]);

  return (
    <AuthGuard>
      <Chat
        id={tempSessionId}
        initialMessages={[]}
        initialChatModel={DEFAULT_CHAT_MODEL}
        isReadonly={false}
      />
    </AuthGuard>
  );
} 