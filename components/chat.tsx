"use client";

import type { Attachment, UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import { useEffect, useState } from "react";
import { ChatHeader } from "@/components/chat-header";
import { generateUUID } from "@/lib/utils";
import { ArtifactViewer } from "./artifact-viewer";
import { MultimodalInput } from "./multimodal-input";
import { Messages } from "./messages";
import { useArtifactSelector } from "@/lib/stores/document-store";
import { useSearchParams } from "next/navigation";
import { ChatSDKError } from "@/lib/chatsdk-errors";
import { ErrorHandlers } from "@/lib/error-handler";
import { createClientAIFetch } from "@/lib/ai/client-fetch";
import { useChatStore } from "@/lib/stores/chat-store";
import { useWindowSize } from "usehooks-ts";

export function Chat({
  id,
  initialMessages,
  isReadonly,
}: {
  id: string;
  initialMessages: Array<UIMessage>;
  isReadonly: boolean;
}) {
  const { setCurrentSessionId } = useChatStore();
  
  const {
    messages,
    setMessages: setChatMessages,
    handleSubmit,
    input,
    setInput,
    append,
    status,
    stop,
    reload
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
    onError: (error) => {
      let errorMessage: UIMessage;

      if (error instanceof ChatSDKError) {
        errorMessage = ErrorHandlers.api(error.message);
      } else if (
        error.name === "TypeError" &&
        error.message.includes("fetch")
      ) {
        errorMessage = ErrorHandlers.network(
          "Failed to connect to the AI service"
        );
      } else if (error.message.includes("timeout")) {
        errorMessage = ErrorHandlers.timeout("AI response");
      } else {
        errorMessage = ErrorHandlers.generic(error.message);
      }

      // Add error message to chat
      setChatMessages((messages) => [...messages, errorMessage]);
    },
  });

  const searchParams = useSearchParams();
  const query = searchParams.get("query");

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      // make sure current session is active
      setCurrentSessionId(id);
      
      append({
        role: "user",
        content: query,
      });

      setHasAppendedQuery(true);
    }
  }, [query, append, hasAppendedQuery, id, setCurrentSessionId]);

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);
  const { width: windowWidth } = useWindowSize();
  const isMobile = windowWidth ? windowWidth < 768 : false;

  // Chat sidebar width when artifact is visible
  const chatSidebarWidth = 400;
  const artifactWidth = windowWidth ? windowWidth - chatSidebarWidth : `calc(100dvw - ${chatSidebarWidth}px)`;

  return (
    <div
      className={
        isArtifactVisible
          ? "flex flex-row h-dvh w-dvw fixed top-0 left-0 z-50 bg-transparent"
          : "flex flex-col relative min-w-0 h-dvh bg-background"
      }
    >
      {/* Artifact viewer */}
      {isArtifactVisible && (
        <ArtifactViewer
          status={status}
          stop={stop}
          setMessages={setChatMessages}
          append={append}
          width={typeof artifactWidth === 'string' ? undefined : artifactWidth}
        />
      )}

      {/* Chat */}
      <div
        className={
          isArtifactVisible
            ? "fixed bg-muted dark:bg-background h-dvh shrink-0 flex flex-col max-w-[400px] right-0 top-0 left-auto"
            : "flex flex-col w-full h-dvh bg-background"
        }
      >
        <ChatHeader isReadonly={isReadonly} />

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
            isArtifactVisible
              ? "flex flex-row gap-2 relative items-end w-full px-4 pb-4"
              : "flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl"
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
              className={isArtifactVisible ? "bg-background dark:bg-muted" : undefined}
              setMessages={setChatMessages}
            />
          )}
        </form>
      </div>
    </div>
  );
}
