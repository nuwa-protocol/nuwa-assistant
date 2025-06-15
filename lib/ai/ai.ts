import { streamText, smoothStream, appendResponseMessages, type Message } from "ai";
import { myProvider } from "./providers";
import { systemPrompt } from "./prompts";
import { getWeather } from "./tools/get-weather";
import { generateUUID, getClientLocation } from "@/lib/utils";
import { useChatStore } from "@/lib/stores/chat-store";
import { createDocument } from "./tools/create-document";
import { updateDocument } from "./tools/update-document";
import { requestSuggestions } from "./tools/request-suggestions";

// Default model to use
const DEFAULT_CHAT_MODEL = "chat-model";

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
  messages,
  lastMessage,
  signal,
}: {
  sessionId: string;
  lastMessage: Message;
  messages: Message[];
  signal?: AbortSignal;
}) => {
  const { updateMessages, updateTitle, updateSession, createStreamId } =
    useChatStore.getState();

  updateSession(sessionId, {
    updatedAt: Date.now(),
  });

  const hints = await getClientLocation();

  // Create streamId for stream resumption
  const streamId = generateUUID();
  createStreamId(streamId, sessionId);

  const result = streamText({
    model: myProvider.languageModel(DEFAULT_CHAT_MODEL),
    system: systemPrompt({ requestHints: hints }),
    messages,
    maxSteps: 5,
    experimental_activeTools: [
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

  return dataStreamResponse;

  // To do: add stream resumption
  // const streamContext = getStreamContext();

  // if (streamContext) {
  //   const resumedStream = await streamContext.resumableStream(
  //     streamId,
  //     () => dataStreamResponse.body!
  //   );
  //   return new Response(resumedStream);
  // } else {
  //   return dataStreamResponse;
  // }
};

export { handleAIRequest };
