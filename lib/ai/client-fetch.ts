"use client";

import { ChatSDKError } from "../chatsdk-errors";
import { handleAIRequest } from "./ai";

export const createClientAIFetch = (): ((
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>) => {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      if (!init || !init.body) {
        throw new Error("Request body is required");
      }

      const requestBody = JSON.parse(init.body as string);
      const {
        id: sessionId,
        messages,
        lastMessage,
      } = requestBody;

      const response = await handleAIRequest({
        sessionId,
        messages,
        lastMessage,
        signal: init?.signal ?? undefined,
      });

      return response;
    } catch (error) {
      if (error instanceof ChatSDKError) {
        return new Response(JSON.stringify({ error: "AI request failed" }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        });
      }
      return new Response(JSON.stringify({ error: "Unknown error occurred" }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  };
};
