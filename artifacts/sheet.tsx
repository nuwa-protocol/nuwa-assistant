import { Artifact } from '@/components/create-artifact';
import {
  CopyIcon,
  LineChartIcon,
  RedoIcon,
  SparklesIcon,
  UndoIcon,
} from '@/components/icons';
import { SpreadsheetEditor } from '@/components/sheet-editor';
import { parse, unparse } from 'papaparse';
import { toast } from 'sonner';
import { z } from 'zod';
import { streamObject } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import { sheetPrompt, updateDocumentPrompt } from '@/lib/ai/prompts';
import { getLocaleText } from '@/locales/use-locale';
import { useSettingsStore } from '@/stores/settings-store';

const language = useSettingsStore.getState().settings.language;
const { t } = getLocaleText(language);

// 客户端AI生成函数
async function generateSheetContent(
  title: string,
  onDelta: (delta: string) => void,
): Promise<string> {
  let draftContent = '';

  const { fullStream } = streamObject({
    model: myProvider.languageModel('artifact-model'),
    system: sheetPrompt,
    prompt: title,
    schema: z.object({
      csv: z.string().describe('CSV data'),
    }),
  });

  for await (const delta of fullStream) {
    if (delta.type === 'object' && delta.object.csv) {
      draftContent = delta.object.csv;
      onDelta(delta.object.csv);
    }
  }

  return draftContent;
}

async function updateSheetContent(
  currentContent: string,
  description: string,
  onDelta: (delta: string) => void,
): Promise<string> {
  let draftContent = '';

  const { fullStream } = streamObject({
    model: myProvider.languageModel('artifact-model'),
    system: updateDocumentPrompt(currentContent, 'sheet'),
    prompt: description,
    schema: z.object({
      csv: z.string(),
    }),
  });

  for await (const delta of fullStream) {
    if (delta.type === 'object' && delta.object.csv) {
      draftContent = delta.object.csv;
      onDelta(delta.object.csv);
    }
  }

  return draftContent;
}

type Metadata = any;

export const sheetArtifact = new Artifact<'sheet', Metadata>({
  kind: 'sheet',
  description: t('artifact.sheet.description'),
  initialize: async () => {},
  content: (props) => {
    return (
      <SpreadsheetEditor
        content={props.content}
        currentVersionIndex={props.currentVersionIndex}
        isCurrentVersion={props.isCurrentVersion}
        saveContent={props.onSaveContent}
        status={props.status}
      />
    );
  },
  actions: [
    {
      icon: <UndoIcon size={18} />,
      description: t('artifact.sheet.actions.undo'),
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('prev');
      },
      isDisabled: ({ currentVersionIndex }) => {
        if (currentVersionIndex === 0) {
          return true;
        }
        return false;
      },
    },
    {
      icon: <RedoIcon size={18} />,
      description: t('artifact.sheet.actions.redo'),
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('next');
      },
      isDisabled: ({ isCurrentVersion }) => {
        if (isCurrentVersion) {
          return true;
        }
        return false;
      },
    },
    {
      icon: <CopyIcon />,
      description: t('artifact.sheet.actions.copy'),
      onClick: ({ content }) => {
        const parsed = parse<string[]>(content, { skipEmptyLines: true });
        const nonEmptyRows = parsed.data.filter((row) =>
          row.some((cell) => cell.trim() !== ''),
        );
        const cleanedCsv = unparse(nonEmptyRows);
        navigator.clipboard.writeText(cleanedCsv);
        toast.success(t('artifact.sheet.copiedCsv'));
      },
    },
  ],
  toolbar: [
    {
      description: t('artifact.sheet.toolbar.format'),
      icon: <SparklesIcon />,
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content: t('artifact.sheet.formatPrompt'),
        });
      },
    },
    {
      description: t('artifact.sheet.toolbar.analyze'),
      icon: <LineChartIcon />,
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content: t('artifact.sheet.analyzePrompt'),
        });
      },
    },
  ],
});

// 导出生成函数供外部使用
export { generateSheetContent, updateSheetContent };
