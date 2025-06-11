'use client';

import type { Attachment, UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useEffect, useState } from 'react';
import { useSWRConfig } from 'swr';
import { ChatHeader } from '@/components/chat-header';
import { generateUUID } from '@/lib/utils';
import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { useSearchParams } from 'next/navigation';
import { useAutoResume } from '@/hooks/use-auto-resume';
import { ChatSDKError } from '@/lib/errors';
import { useChatStore } from '@/lib/stores/chat-store';
import { ErrorHandlers, handleAsyncError } from '@/lib/utils/error-handler';
import { createClientAIFetch } from '@/lib/ai/client';

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  isReadonly,
  autoResume,
}: {
  id: string;
  initialMessages: Array<UIMessage>;
  initialChatModel: string;
  isReadonly: boolean;
  autoResume: boolean;
}) {
  const { mutate } = useSWRConfig();
  const { addMessage, updateMessage, updateSession } = useChatStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    messages,
    setMessages: setChatMessages,
    handleSubmit: originalHandleSubmit,
    input,
    setInput,
    append,
    status,
    stop,
    reload,
    experimental_resume,
    data,
  } = useChat({
    id,
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    fetch: createClientAIFetch(), // 直接使用客户端fetch
    experimental_prepareRequestBody: (body) => ({
      id,
      message: body.messages.at(-1),
      messages: body.messages,
      selectedChatModel: initialChatModel,
    }),
    onFinish: () => {
      setIsLoading(false);
      // 聊天完成后，同步消息到客户端存储
      messages.forEach(message => {
        addMessage(id, message);
      });
    },
    onError: (error) => {
      setIsLoading(false);
      let errorMessage: UIMessage;
      
      if (error instanceof ChatSDKError) {
        errorMessage = ErrorHandlers.api(error.message);
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = ErrorHandlers.network('Failed to connect to the AI service');
      } else if (error.message.includes('timeout')) {
        errorMessage = ErrorHandlers.timeout('AI response');
      } else {
        errorMessage = ErrorHandlers.generic(error.message);
      }
      
      // 将错误消息添加到聊天中
      addMessage(id, errorMessage);
    },
  });

  // 包装 handleSubmit 以添加加载状态
  const handleSubmit = (event?: { preventDefault?: () => void }) => {
    setIsLoading(true);
    try {
      originalHandleSubmit(event);
    } catch (error) {
      setIsLoading(false);
      console.error('Submit error:', error);
      const errorMessage = ErrorHandlers.generic('Failed to send message');
      addMessage(id, errorMessage);
    }
  };

  // 同步会话元数据
  useEffect(() => {
    handleAsyncError(
      Promise.resolve(updateSession(id, {
        updatedAt: Date.now(),
      })),
      () => console.warn('Failed to update session metadata')
    );
  }, [id, updateSession]);

  const searchParams = useSearchParams();
  const query = searchParams.get('query');

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      append({
        role: 'user',
        content: query,
      });

      setHasAppendedQuery(true);
      window.history.replaceState({}, '', `/chat/${id}`);
    }
  }, [query, append, hasAppendedQuery, id]);

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  useAutoResume({
    autoResume,
    initialMessages,
    experimental_resume,
    data,
    setMessages: setChatMessages,
  });

  // 检查是否正在加载
  const isGenerating = status === 'streaming' || isLoading;

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader
          chatId={id}
          selectedModelId={initialChatModel}
          isReadonly={isReadonly}
        />

        <Messages
          chatId={id}
          status={status}
          messages={messages}
          setMessages={setChatMessages}
          reload={reload}
          isReadonly={isReadonly}
          isArtifactVisible={isArtifactVisible}
        />

        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          {!isReadonly && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              status={status}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setChatMessages}
              append={append}
            />
          )}
        </form>

        {/* 加载状态指示器 */}
        {isGenerating && (
          <div className="fixed bottom-20 right-4 bg-background border rounded-lg shadow-lg p-3 z-50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground" />
              <span>AI is thinking...</span>
            </div>
          </div>
        )}
      </div>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        status={status}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        append={append}
        messages={messages}
        setMessages={setChatMessages}
        reload={reload}
        isReadonly={isReadonly}
      />
    </>
  );
}
