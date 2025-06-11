'use client';

import { streamText, smoothStream, UIMessage, generateText } from 'ai';
import { type RequestHints, systemPrompt } from './prompts';
import { myProvider } from './providers';
import { getWeather } from './tools/get-weather';
import { generateUUID } from '@/lib/utils';

// 获取地理位置信息的客户端版本
const getClientLocation = async (): Promise<RequestHints> => {
  try {
    // 尝试使用浏览器的地理位置API
    if (navigator.geolocation) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude.toString(),
              longitude: position.coords.longitude.toString(),
              city: undefined, // 浏览器API不提供城市信息
              country: undefined, // 浏览器API不提供国家信息
            });
          },
          () => {
            // 如果获取位置失败，返回默认值
            resolve({
              latitude: undefined,
              longitude: undefined,
              city: undefined,
              country: undefined,
            });
          }
        );
      });
    }
  } catch (error) {
    console.error('Failed to get location:', error);
  }

  // 返回默认值
  return {
    latitude: undefined,
    longitude: undefined,
    city: undefined,
    country: undefined,
  };
};

// 错误处理函数
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

// 创建客户端AI处理函数
export const createClientAIFetch = (): ((input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) => {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      if (!init || !init.body) {
        throw new Error('Request body is required');
      }

      const requestBody = JSON.parse(init.body as string);
      const { messages, selectedChatModel } = requestBody;


      // 在请求时获取地理位置信息
      const hints = await getClientLocation();

      // 创建流式AI响应
      const result = streamText({
        model: myProvider.languageModel(selectedChatModel),
        system: systemPrompt({ selectedChatModel, requestHints: hints }),
        messages,
        maxSteps: 5,
        experimental_activeTools:
          selectedChatModel === 'chat-model-reasoning'
            ? []
            : ['getWeather'],
        experimental_transform: smoothStream({ chunking: 'word' }),
        experimental_generateMessageId: generateUUID,
        tools: {
          getWeather,
        },
        abortSignal: init.signal || undefined,
      });

      return result.toDataStreamResponse({
        getErrorMessage: errorHandler,
      });
    } catch (error) {
      console.error('Client AI fetch error:', error);
      // 返回错误响应
      return new Response(
        JSON.stringify({ error: 'AI request failed' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
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
