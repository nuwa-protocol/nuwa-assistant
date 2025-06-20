'use client';

import { Artifact } from '@/components/artifact';
import {
  type ChatSession,
  createInitialChatSession,
  useChatStore,
} from '@/lib/stores/chat-store';
import { useSearchParams } from 'next/navigation';
import { convertToUIMessage } from '@/lib/utils/message';
import Loading from '../loading';
import { useEffect, useState } from 'react';

export default function Page() {
  const searchParams = useSearchParams();
  const chatId = searchParams.get('cid');
  const { getSession } = useChatStore();
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = chatId ? getSession(chatId) : null;
    const newChatSession =
      chatId && session ? session : createInitialChatSession();

    setChatSession(newChatSession);
    setIsLoading(false);
  }, [chatId, getSession]);

  if (isLoading || !chatSession) {
    return <Loading />;
  }

  return (
    <Artifact
      chatId={chatSession.id}
      initialMessages={chatSession.messages.map(convertToUIMessage)}
      isReadonly={false}
    />
  );
}
