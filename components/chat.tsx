'use client';

import type { Attachment, UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import { generateUUID } from '@/utils';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import { ChatSDKError } from '@/utils/chatsdk-errors';
import { ErrorHandlers } from '@/utils/error-handler';
import { createClientAIFetch } from '@/lib/ai/client-fetch';
import Header from './layout-header';
import { useRouter } from 'next/navigation';

export function Chat({
  id,
  initialMessages,
  isReadonly,
}: {
  id: string;
  initialMessages: Array<UIMessage>;
  isReadonly: boolean;
}) {
  const router = useRouter();
  const handleUseChatError = (error: Error) => {
    let errorMessage: UIMessage;
    if (error instanceof ChatSDKError) {
      errorMessage = ErrorHandlers.api(error.message);
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorMessage = ErrorHandlers.network(
        'Failed to connect to the AI service',
      );
    } else if (error.message.includes('timeout')) {
      errorMessage = ErrorHandlers.timeout('AI response');
    } else {
      errorMessage = ErrorHandlers.generic(error.message);
    }
    // Add error message to chat
    setChatMessages((messages) => [...messages, errorMessage]);
  };

  const {
    messages,
    setMessages: setChatMessages,
    handleSubmit,
    input,
    setInput,
    append,
    status,
    stop,
    reload,
  } = useChat({
    id,
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    fetch: createClientAIFetch(),
    experimental_prepareRequestBody: (body) => ({
      id,
      messages: body.messages,
      lastMessage: body.messages.at(-1),
    }),
    onError: handleUseChatError,
    onFinish: () => {
      router.push(`/chat?cid=${id}`);
    },
  });

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);

  return (
    <div className="flex flex-col relative min-w-0 h-dvh bg-background">
      {/* Artifact viewer */}

      {/* Chat */}
      <div className={'flex flex-col w-full h-dvh bg-background'}>
        <Header />
        <Messages
          chatId={id}
          status={status}
          messages={messages}
          setMessages={setChatMessages}
          reload={reload}
          isReadonly={isReadonly}
        />

        <form
          className={
            'flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl'
          }
        >
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
              append={append}
              className={undefined}
              setMessages={setChatMessages}
            />
          )}
        </form>
      </div>
    </div>
  );
}
