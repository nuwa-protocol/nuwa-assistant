import { generateUUID } from '@/lib/utils';
import { type DataStreamWriter, tool } from 'ai';
import { z } from 'zod';

export const requestSuggestions = ({ dataStream }: { dataStream: DataStreamWriter }) =>
  tool({
    description:
      'Request suggestions for improving a document or specific text. This tool will analyze the content and provide helpful recommendations.',
    parameters: z.object({
      documentId: z.string().describe('The ID of the document to get suggestions for'),
      selectedText: z.string().optional().describe('Specific text to focus suggestions on (optional)'),
      type: z.enum(['grammar', 'style', 'content', 'structure', 'general']).default('general').describe(
        'The type of suggestions to provide'
      ),
    }),
    execute: async ({ documentId, selectedText, type }) => {
      const suggestionId = generateUUID();

      // 发送建议请求到客户端
      dataStream.writeData({
        type: 'suggestion-request',
        content: JSON.stringify({
          suggestionId,
          documentId,
          selectedText,
          type,
        }),
      });

      dataStream.writeData({
        type: 'clear',
        content: '',
      });

      // 生成建议内容
      const suggestions = generateSuggestions(selectedText || '', type);

      // 发送建议内容
      dataStream.writeData({
        type: 'suggestions',
        content: JSON.stringify(suggestions),
      });

      dataStream.writeData({ 
        type: 'finish', 
        content: '' 
      });

      return {
        suggestionId,
        documentId,
        type,
        count: suggestions.length,
        content: `Generated ${suggestions.length} ${type} suggestions for the document.`,
      };
    },
  });

// 生成建议函数
function generateSuggestions(text: string, type: string) {
  const suggestions = [];

  switch (type) {
    case 'grammar':
      suggestions.push(
        {
          id: generateUUID(),
          type: 'grammar',
          description: 'Check sentence structure and punctuation',
          originalText: text || 'example text',
          suggestedText: 'Improved version with better grammar',
          severity: 'medium',
        },
        {
          id: generateUUID(),
          type: 'grammar',
          description: 'Consider using active voice',
          originalText: text || 'example passive sentence',
          suggestedText: 'Active voice version',
          severity: 'low',
        }
      );
      break;

    case 'style':
      suggestions.push(
        {
          id: generateUUID(),
          type: 'style',
          description: 'Improve readability with shorter sentences',
          originalText: text || 'long complex sentence',
          suggestedText: 'Shorter, clearer version',
          severity: 'medium',
        },
        {
          id: generateUUID(),
          type: 'style',
          description: 'Use more engaging language',
          originalText: text || 'bland text',
          suggestedText: 'More engaging version',
          severity: 'low',
        }
      );
      break;

    case 'content':
      suggestions.push(
        {
          id: generateUUID(),
          type: 'content',
          description: 'Add more specific examples',
          originalText: text || 'general statement',
          suggestedText: 'Statement with specific examples',
          severity: 'high',
        },
        {
          id: generateUUID(),
          type: 'content',
          description: 'Clarify technical terms',
          originalText: text || 'technical jargon',
          suggestedText: 'Explained version',
          severity: 'medium',
        }
      );
      break;

    case 'structure':
      suggestions.push(
        {
          id: generateUUID(),
          type: 'structure',
          description: 'Add section headings for better organization',
          originalText: text || 'unstructured content',
          suggestedText: 'Well-structured content with headings',
          severity: 'high',
        },
        {
          id: generateUUID(),
          type: 'structure',
          description: 'Consider reordering for logical flow',
          originalText: text || 'current order',
          suggestedText: 'Improved logical order',
          severity: 'medium',
        }
      );
      break;

    default: // general
      suggestions.push(
        {
          id: generateUUID(),
          type: 'general',
          description: 'Overall readability improvement',
          originalText: text || 'original text',
          suggestedText: 'More readable version',
          severity: 'medium',
        },
        {
          id: generateUUID(),
          type: 'general',
          description: 'Enhance clarity and conciseness',
          originalText: text || 'verbose text',
          suggestedText: 'Clearer, more concise version',
          severity: 'low',
        }
      );
  }

  return suggestions;
}
