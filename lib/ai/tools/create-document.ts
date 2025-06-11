import { generateUUID } from '@/lib/utils';
import { type DataStreamWriter, tool } from 'ai';
import { z } from 'zod';

// 支持的文档类型
const documentKinds = ['text', 'code', 'image', 'sheet'] as const;

export const createDocument = ({ dataStream }: { dataStream: DataStreamWriter }) =>
  tool({
    description:
      'Create a document for writing or content creation activities. This tool will generate the contents of the document based on the title and kind.',
    parameters: z.object({
      title: z.string().describe('The title of the document'),
      kind: z.enum(documentKinds).describe('The type of document to create'),
    }),
    execute: async ({ title, kind }) => {
      const id = generateUUID();

      // 发送文档元数据到客户端
      dataStream.writeData({
        type: 'kind',
        content: kind,
      });

      dataStream.writeData({
        type: 'id',
        content: id,
      });

      dataStream.writeData({
        type: 'title',
        content: title,
      });

      dataStream.writeData({
        type: 'clear',
        content: '',
      });

      // 根据文档类型生成内容
      let content = '';
      switch (kind) {
        case 'text':
          content = generateTextDocument(title);
          break;
        case 'code':
          content = generateCodeDocument(title);
          break;
        case 'sheet':
          content = generateSheetDocument(title);
          break;
        case 'image':
          content = generateImageDocument(title);
          break;
        default:
          content = `# ${title}\n\nDocument content goes here...`;
      }

      // 将内容发送到客户端
      dataStream.writeData({
        type: 'content',
        content: content,
      });

      dataStream.writeData({ 
        type: 'finish', 
        content: '' 
      });

      return {
        id,
        title,
        kind,
        content: 'A document was created and is now visible to the user.',
      };
    },
  });

// 生成文本文档内容
function generateTextDocument(title: string): string {
  return `# ${title}

Welcome to your new document! This is a text document where you can write and organize your thoughts.

## Getting Started

You can edit this document by:
- Adding headings with # symbols
- Creating lists with - or * symbols  
- Adding **bold** or *italic* text
- Including links and other markdown formatting

## Notes

- All changes are saved automatically to your local storage
- You can create multiple documents and organize them as needed
- Use the document tools to get suggestions and improvements

Start writing your content below:

---

*Your content goes here...*`;
}

// 生成代码文档内容
function generateCodeDocument(title: string): string {
  return `# ${title}

This is a code document where you can write and organize code snippets, algorithms, or programming notes.

## Example Code

\`\`\`javascript
// Example function
function greeting(name) {
  return \`Hello, \${name}!\`;
}

console.log(greeting("World"));
\`\`\`

## Features

- Syntax highlighting for multiple languages
- Code organization and documentation
- Easy sharing and collaboration
- Version tracking

## Your Code

\`\`\`
// Start writing your code here...

\`\`\`

## Notes

Add any notes, explanations, or documentation about your code here.`;
}

// 生成表格文档内容
function generateSheetDocument(title: string): string {
  return `# ${title}

This is a sheet document for organizing data in a structured format.

| Column A | Column B | Column C | Notes |
|----------|----------|----------|-------|
| Item 1   | Value 1  | Data 1   | Note 1 |
| Item 2   | Value 2  | Data 2   | Note 2 |
| Item 3   | Value 3  | Data 3   | Note 3 |

## Instructions

- Edit the table above to add your data
- You can add more rows by copying the format
- Use the pipe | symbol to separate columns
- Keep column headers aligned for best formatting

## Calculations

You can add formulas or calculations here:

- Total items: 3
- Sum of values: (manual calculation)
- Average: (manual calculation)

## Notes

Add any additional notes or context about your data here.`;
}

// 生成图片文档内容
function generateImageDocument(title: string): string {
  return `# ${title}

This is an image document for organizing visual content and media.

## Image Placeholder

![${title}](https://via.placeholder.com/600x400/cccccc/666666?text=${encodeURIComponent(title)})

## Description

Add a description of your image or visual content here.

## Image Details

- **Title**: ${title}
- **Type**: Image Document
- **Created**: ${new Date().toLocaleDateString()}
- **Status**: Draft

## Notes

- You can replace the placeholder with your actual image
- Add captions, alt text, and descriptions
- Organize multiple images in a single document
- Include metadata and organization notes

## Additional Images

You can add more images below:

<!-- Add more images here -->`;
}
