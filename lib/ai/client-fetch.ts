'use client';

import {
  streamText,
  smoothStream,
  UIMessage,
  generateText,
  appendResponseMessages
} from 'ai';
import { type RequestHints, systemPrompt } from './prompts';
import { myProvider } from './providers';
import { getWeather } from './tools/get-weather';
import { generateUUID } from '@/lib/utils';
import { useChatStore } from '@/lib/stores/chat-store';

// Client version of getting location information
const getClientLocation = async (): Promise<RequestHints> => {
  try {
    // Try to use the browser's location API
    if (navigator.geolocation) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude.toString(),
              longitude: position.coords.longitude.toString(),
              city: undefined, // Browser API does not provide city information
              country: undefined, // Browser API does not provide country information
            });
          },
          () => {
            // If location retrieval fails, return default value
            resolve({
              latitude: undefined,
              longitude: undefined,
              city: undefined,
              country: undefined,
            });
          },
        );
      });
    }
  } catch (error) {
    console.error('Failed to get location:', error);
  }

  // Return default value
  return {
    latitude: undefined,
    longitude: undefined,
    city: undefined,
    country: undefined,
  };
};

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

// Create client-side fetch function for useChat hook
export const createClientAIFetch = (): ((
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>) => {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      if (!init || !init.body) {
        throw new Error('Request body is required');
      }

      const requestBody = JSON.parse(init.body as string);
      const { id: sessionId, message, messages, selectedChatModel } = requestBody;

      // Get chat store methods
      const { addMessage,updateTitle } = useChatStore.getState();

      addMessage(sessionId, message);

      // Get location information when requesting
      const hints = await getClientLocation();

      // Create streaming AI response
      const result = streamText({
        model: myProvider.languageModel(selectedChatModel),
        system: systemPrompt({ selectedChatModel, requestHints: hints }),
        messages,
        maxSteps: 5,
        experimental_activeTools:
          selectedChatModel === 'chat-model-reasoning' ? [] : ['getWeather'],
        experimental_transform: smoothStream({ chunking: 'word' }),
        experimental_generateMessageId: generateUUID,
        tools: {
          getWeather,
        },
        abortSignal: init.signal || undefined,
        async onFinish({ response }) {
          const [, assistantMessage] = appendResponseMessages({
            messages: [message],
            responseMessages: response.messages,
          });
          // add the response messages to the chat store
          await addMessage(sessionId,assistantMessage);
          await updateTitle(sessionId);
        },
      });

      return result.toDataStreamResponse({
        getErrorMessage: errorHandler,
      });
    } catch (error) {
      console.error('Client AI fetch error:', error);
      // Return error response
      return new Response(JSON.stringify({ error: 'AI request failed' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  };
};

export async function generateTitleFromUserMessage({
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
