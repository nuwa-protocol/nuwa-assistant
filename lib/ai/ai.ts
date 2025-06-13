import { generateText, Message } from "ai";
import { myProvider } from "./providers";
import { streamText, smoothStream, appendResponseMessages } from "ai";
import { systemPrompt } from "./prompts";
import { getWeather } from "./tools/get-weather";
import { generateUUID, getClientLocation } from "@/lib/utils";
import { useChatStore } from "@/lib/stores/chat-store";
import { createDocument } from "./tools/create-document";
import { updateDocument } from "./tools/update-document";
import { requestSuggestions } from "./tools/request-suggestions";
import { getStreamContext } from "./client-stream";

async function generateTitleFromUserMessage({ message }: { message: Message }) {
  const { text: title } = await generateText({
    model: myProvider.languageModel("title-model"),
    system: `\n
      - you will generate a short title based on the first message a user begins a conversation with
      - ensure it is not more than 80 characters long
      - the title should be a summary of the user's message
      - do not use quotes or colons`,
    prompt: JSON.stringify(message),
  });

  return title;
}

// Error handling function
function errorHandler(error: unknown) {
  if (error == null) {
    return "unknown error";
  }

  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return JSON.stringify(error);
}

// Handle AI request, entrance of the AI workflow
const handleAIRequest = async ({
  sessionId,
  selectedChatModel,
  messages,
  lastMessage,
  signal,
}: {
  sessionId: string;
  lastMessage: Message;
  messages: Message[];
  selectedChatModel: string;
  signal?: AbortSignal;
}) => {
  const { updateMessages, updateTitle, updateSession, createStreamId } =
    useChatStore.getState();

  updateSession(sessionId, {
    updatedAt: Date.now(),
  });

  const hints = await getClientLocation();

  // 创建 streamId 用于断流恢复
  const streamId = generateUUID();
  createStreamId(streamId, sessionId);

  const result = streamText({
    model: myProvider.languageModel(selectedChatModel),
    system: systemPrompt({ selectedChatModel, requestHints: hints }),
    messages,
    maxSteps: 5,
    experimental_activeTools:
      selectedChatModel === "chat-model-reasoning"
        ? []
        : [
            "getWeather",
            "createDocument",
            "updateDocument",
            "requestSuggestions",
          ],
    experimental_transform: smoothStream({ chunking: "word" }),
    experimental_generateMessageId: generateUUID,
    tools: {
      getWeather,
      createDocument: createDocument(),
      updateDocument: updateDocument(),
      requestSuggestions: requestSuggestions(),
    },
    abortSignal: signal,
    async onFinish({ response }) {
      const finalMessages = appendResponseMessages({
        messages: messages,
        responseMessages: response.messages,
      });

      await updateMessages(sessionId, finalMessages);
      await updateTitle(sessionId);
    },
  });

  const dataStreamResponse = result.toDataStreamResponse({
    getErrorMessage: errorHandler,
  });

  // 添加断流恢复功能
  const streamContext = getStreamContext();

  if (streamContext) {
    const resumedStream = await streamContext.resumableStream(
      streamId,
      () => dataStreamResponse.body!
    );
    return new Response(resumedStream);
  } else {
    return dataStreamResponse;
  }
};

export { handleAIRequest, generateTitleFromUserMessage };
