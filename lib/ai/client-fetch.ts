'use client';

import { handleAIRequest } from './ai';

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
      const { id: sessionId,selectedChatModel, messages,lastMessage} = requestBody;

      return await handleAIRequest({
        sessionId,
        selectedChatModel,
        messages,
        lastMessage,
        signal: init.signal || undefined,
      });
    } catch (error) {
      console.error('Client AI fetch error:', error);
      return new Response(JSON.stringify({ error: 'AI request failed' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  };
};
