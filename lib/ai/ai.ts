import { generateText, UIMessage } from "ai";
import { myProvider } from "./providers";
import {
  streamText,
  smoothStream, appendResponseMessages
} from 'ai';
import { systemPrompt } from './prompts';
import { getWeather } from './tools/get-weather';
import { generateUUID, getClientLocation } from '@/lib/utils';
import { useChatStore } from '@/lib/stores/chat-store';


async function generateTitleFromUserMessage({
    message,
  }: {
    message: UIMessage;
  }) {
    const { text: title } = await generateText({
      model: myProvider.languageModel('title-model'),
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
    return 'unknown error';
  }

  if (typeof error === 'string') {
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
  lastMessage: UIMessage;
  messages: UIMessage[];
  selectedChatModel: string;
  signal?: AbortSignal;
}) => {
  const { addMessage, updateTitle } = useChatStore.getState();
  addMessage(sessionId, lastMessage);

  const hints = await getClientLocation();

  const result = streamText({
    model: myProvider.languageModel(selectedChatModel),
    system: systemPrompt({ selectedChatModel, requestHints: hints }),
    messages,
    maxSteps: 5,
    experimental_activeTools:
      selectedChatModel === 'chat-model-reasoning' ? [] : ['getWeather'],
    experimental_transform: smoothStream({ chunking: 'word' }),
    experimental_generateMessageId: generateUUID,
    tools: { getWeather },
    abortSignal: signal,
    async onFinish({ response }) {
      // this is actually converting ResponseMessage type to UIMessage type
      const [assistantMessage] = appendResponseMessages({
        messages: [],
        responseMessages: response.messages,
      });
      await addMessage(sessionId, assistantMessage);
      await updateTitle(sessionId);
    },
  });
  return result.toDataStreamResponse({
    getErrorMessage: errorHandler,
  });
};


export {handleAIRequest, generateTitleFromUserMessage };