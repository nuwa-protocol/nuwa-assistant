import { type DataStreamWriter, tool } from 'ai';
import { z } from 'zod';

export const updateDocument = ({ dataStream }: { dataStream: DataStreamWriter }) =>
  tool({
    description:
      'Update an existing document with new content. This tool can modify, append, or replace content in documents.',
    parameters: z.object({
      documentId: z.string().describe('The ID of the document to update'),
      title: z.string().optional().describe('New title for the document (optional)'),
      content: z.string().describe('The new content or modifications to apply'),
      operation: z.enum(['replace', 'append', 'prepend']).default('replace').describe(
        'How to apply the content: replace (overwrite), append (add to end), or prepend (add to beginning)'
      ),
    }),
    execute: async ({ documentId, title, content, operation }) => {
      // 发送更新指令到客户端
      dataStream.writeData({
        type: 'document-update',
        content: JSON.stringify({
          documentId,
          title,
          content,
          operation,
        }),
      });

      dataStream.writeData({
        type: 'clear',
        content: '',
      });

      // 发送内容更新
      dataStream.writeData({
        type: 'content',
        content: content,
      });

      dataStream.writeData({ 
        type: 'finish', 
        content: '' 
      });

      return {
        documentId,
        title: title || 'Document',
        operation,
        content: 'The document has been updated successfully.',
      };
    },
  });
