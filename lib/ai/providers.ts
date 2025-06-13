import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { useDIDStore } from "../stores/did-store";

const timestamp = Math.floor(Date.now() / 1000);

const did = useDIDStore.getState().did;

// use client-fetch to fetch data with mocked DID headers
const openai = createOpenAI({
  apiKey: "NOT_USED",
  baseURL: "https://nuwa-production.up.railway.app/api/v1",
  headers: {
    "X-did": did || "did:nuwa:mock-did",
    "x-did-signature": `mock-signature-${btoa(timestamp.toString()).substring(
      0,
      20
    )}`,
    "x-did-timestamp": timestamp.toString(),
  },
});

export const myProvider = customProvider({
  languageModels: {
    "chat-model": openai("gpt-4o-mini"),
    "chat-model-reasoning": wrapLanguageModel({
      model: openai("gpt-4o-mini"),
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),
    "title-model": openai("gpt-4o-mini"),
    "artifact-model": openai("gpt-4o-mini"),
  },
  imageModels: {
    "small-model": openai.image("gpt-4o-mini"),
  },
});
