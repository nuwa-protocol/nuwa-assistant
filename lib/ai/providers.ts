import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// use client-fetch to fetch data
const openai = createOpenAI({
  apiKey: "YOUR_OPENAI_API_KEY",
});

export const myProvider = customProvider({
  languageModels: {
    'chat-model': openai('gpt-4o-mini'),
    'chat-model-reasoning': wrapLanguageModel({
      model: openai('gpt-4o-mini'),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    }),
    'title-model': openai('gpt-4o-mini'),
    'artifact-model': openai('gpt-4o-mini'),
  },
  imageModels: {
    'small-model': openai.image('gpt-4o-mini'),
  },
});
