'use client';

import type { Attachment, UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import { generateUUID } from '@/utils';
import { ArtifactViewer } from './artifact-viewer';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import { useDocumentStore } from '@/stores/document-store';
import { ChatSDKError } from '@/utils/chatsdk-errors';
import { ErrorHandlers } from '@/utils/error-handler';
import { createClientAIFetch } from '@/lib/ai/client-fetch';
import { useWindowSize } from 'usehooks-ts';

export function Artifact({
  chatId,
  initialMessages,
  isReadonly,
}: {
  chatId: string;
  initialMessages: Array<UIMessage>;
  isReadonly: boolean;
}) {
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
    id: chatId,
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    fetch: createClientAIFetch(),
    experimental_prepareRequestBody: (body) => ({
      id: chatId,
      messages: body.messages,
      lastMessage: body.messages.at(-1),
    }),
    onError: handleUseChatError,
  });

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const { currentArtifact } = useDocumentStore();
  const isArtifact = currentArtifact.documentId !== 'init';

  const { width: windowWidth } = useWindowSize();
  const chatSidebarWidth = 400;
  const artifactWidth = windowWidth
    ? windowWidth - chatSidebarWidth
    : `calc(100dvw - ${chatSidebarWidth}px)`;

  if (!isArtifact) {
    return (
      <div className="flex h-full w-full justify-center items-center">
        Todo: this is the all artifact page
      </div>
    );
  }

  return (
    <div className="flex flex-row h-dvh w-dvw fixed top-0 left-0 z-50 bg-transparent">
      {/* Artifact viewer */}

      <ArtifactViewer
        chatId={chatId}
        status={status}
        width={typeof artifactWidth === 'string' ? undefined : artifactWidth}
      />

      {/* Chat */}
      <div className="fixed bg-muted dark:bg-background h-dvh shrink-0 flex flex-col max-w-[400px] right-0 top-0 left-auto">
        <Messages
          chatId={chatId}
          status={status}
          messages={messages}
          setMessages={setChatMessages}
          reload={reload}
          isReadonly={isReadonly}
        />

        <form
          className={'flex flex-row gap-2 relative items-end w-full px-4 pb-4'}
        >
          {!isReadonly && (
            <MultimodalInput
              chatId={chatId}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              status={status}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              append={append}
              className="bg-background dark:bg-muted"
              setMessages={setChatMessages}
            />
          )}
        </form>
      </div>
    </div>
  );
}
