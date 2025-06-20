import { z } from 'zod';
import { streamObject, tool } from 'ai';
import { generateUUID } from '@/utils';
import { myProvider } from '../providers';
import { useDocumentStore } from '@/stores/document-store';

export const requestSuggestions = () =>
  tool({
    description: 'Request AI-generated suggestions for improving a document',
    parameters: z.object({
      documentId: z
        .string()
        .describe('The ID of the document to request suggestions for'),
    }),
    execute: async ({ documentId }) => {
      try {
        // get document from document store
        const documentStore = useDocumentStore.getState();
        const document = documentStore.getDocument(documentId);

        if (!document || !document.content) {
          return {
            error: 'Document not found or has no content',
          };
        }

        const suggestions: Array<{
          originalText: string;
          suggestedText: string;
          description: string;
          id: string;
          documentId: string;
          isResolved: boolean;
        }> = [];

        // generate suggestions based on the document content
        const { elementStream } = streamObject({
          model: myProvider.languageModel('artifact-model'),
          system: `You are a helpful writing assistant. Analyze the provided document and generate specific, actionable suggestions to improve it. Consider grammar, clarity, structure, and style. Max 5 suggestions.`,
          prompt: `Please analyze this document and provide improvement suggestions:\n\n${document.content}`,
          output: 'array',
          schema: z.object({
            originalSentence: z
              .string()
              .describe(
                'The exact text from the document that needs improvement',
              ),
            suggestedSentence: z
              .string()
              .describe('The improved version of the text'),
            description: z
              .string()
              .describe('Explanation of why this change improves the document'),
          }),
        });

        // collect all suggestions
        for await (const element of elementStream) {
          const suggestion = {
            originalText: element.originalSentence,
            suggestedText: element.suggestedSentence,
            description: element.description,
            id: generateUUID(),
            documentId: documentId,
            isResolved: false,
          };

          suggestions.push(suggestion);
        }

        // save suggestions to document store
        suggestions.forEach((suggestion) => {
          documentStore.createSuggestion(
            suggestion.documentId,
            suggestion.originalText,
            suggestion.suggestedText,
            suggestion.description,
          );
        });

        return {
          id: documentId,
          title: document.title,
          kind: document.kind,
          suggestions: suggestions,
          message: `Generated ${suggestions.length} suggestions for "${document.title}"`,
        };
      } catch (error) {
        console.error('Failed to generate suggestions:', error);
        throw error;
      }
    },
  });
