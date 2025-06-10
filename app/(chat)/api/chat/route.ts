import {
  appendClientMessage, streamText
} from 'ai';
import { type RequestHints, systemPrompt } from '@/lib/ai/prompts';
import { myProvider } from '@/lib/ai/providers';
import { postRequestBodySchema, type PostRequestBody } from './schema';
import { geolocation } from '@vercel/functions';
import { ChatSDKError } from '@/lib/errors';

export const maxDuration = 60;

export async function POST(request: Request) {
  let requestBody: PostRequestBody;


  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  console.log('requestBody', requestBody);

  try {
    const { message, selectedChatModel, messages: previousMessages } = requestBody;

    // 拼接消息历史（由客户端传入）
    const messages = appendClientMessage({
      messages: previousMessages || [],
      message,
    });

    // 获取地理信息作为AI提示
    const { longitude, latitude, city, country } = geolocation(request);
    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };


    const result = streamText({
      model: myProvider.languageModel(selectedChatModel),
      system: systemPrompt({ selectedChatModel, requestHints }),
      messages,
    });
  
    return result.toDataStreamResponse();


    // 创建AI流式响应
    // const stream = createDataStream({
    //   execute: (dataStream) => {
    //     const result = streamText({
    //       model: myProvider.languageModel(selectedChatModel),
    //       system: systemPrompt({ selectedChatModel, requestHints }),
    //       messages,
    //       maxSteps: 5,
    //       experimental_activeTools:
    //         selectedChatModel === 'chat-model-reasoning'
    //           ? []
    //           : ['getWeather'],
    //       experimental_transform: smoothStream({ chunking: 'word' }),
    //       experimental_generateMessageId: generateUUID,
    //       tools: {
    //         getWeather,
    //       },
    //       experimental_telemetry: {
    //         isEnabled: isProductionEnvironment,
    //         functionId: 'stream-text',
    //       },
    //     });

    //     result.consumeStream();
    //     result.mergeIntoDataStream(dataStream, {
    //       sendReasoning: true,
    //     });
    //   },
    //   onError: () => {
    //     return 'Oops, an error occurred!';
    //   },
    // });

    // return new Response(stream);
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return new Response('Internal server error', { status: 500 });
  }
}
