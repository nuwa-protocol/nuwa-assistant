import { memo } from 'react';

import type { ArtifactKind } from '@/artifacts';
import { FileIcon, LoaderIcon, MessageIcon, PencilEditIcon } from './icons';
import { toast } from 'sonner';
import { useCurrentArtifact } from '@/lib/stores/document-store';
import { useLocale } from '@/locales/use-locale';
import { useRouter } from 'next/navigation';

const getActionText = (
  type: 'create' | 'update' | 'request-suggestions',
  tense: 'present' | 'past',
  t: (key: string) => string,
) => {
  switch (type) {
    case 'create':
      return tense === 'present'
        ? t('documentTool.creating')
        : t('documentTool.created');
    case 'update':
      return tense === 'present'
        ? t('documentTool.updating')
        : t('documentTool.updated');
    case 'request-suggestions':
      return tense === 'present'
        ? t('documentTool.addingSuggestions')
        : t('documentTool.addedSuggestions');
    default:
      return null;
  }
};

interface DocumentToolResultProps {
  chatId: string;
  type: 'create' | 'update' | 'request-suggestions';
  result: { id: string; title: string; kind: ArtifactKind };
  isReadonly: boolean;
}

function PureDocumentToolResult({
  chatId,
  type,
  result,
  isReadonly,
}: DocumentToolResultProps) {
  const { setArtifact } = useCurrentArtifact();
  const { t } = useLocale();
  const router = useRouter();

  return (
    <button
      type="button"
      className="bg-background cursor-pointer border py-2 px-3 rounded-xl w-fit flex flex-row gap-3 items-start"
      onClick={(event) => {
        if (isReadonly) {
          toast.error(t('documentTool.viewingNotSupported'));
          return;
        }

        setArtifact({
          documentId: result.id,
          kind: result.kind,
          content: '',
          title: result.title,
          status: 'idle',
        });
        router.push(`/artifact?cid=${chatId}`);
      }}
    >
      <div className="text-muted-foreground mt-1">
        {type === 'create' ? (
          <FileIcon />
        ) : type === 'update' ? (
          <PencilEditIcon />
        ) : type === 'request-suggestions' ? (
          <MessageIcon />
        ) : null}
      </div>
      <div className="text-left">
        {`${getActionText(type, 'past', t)} "${result.title}"`}
      </div>
    </button>
  );
}

export const DocumentToolResult = memo(PureDocumentToolResult, () => true);

interface DocumentToolCallProps {
  chatId: string;
  type: 'create' | 'update' | 'request-suggestions';
  args: { title: string };
  isReadonly: boolean;
}

function PureDocumentToolCall({
  chatId,
  type,
  args,
  isReadonly,
}: DocumentToolCallProps) {
  const { setArtifact } = useCurrentArtifact();
  const { t } = useLocale();
  const router = useRouter();

  return (
    <button
      type="button"
      className="cursor pointer w-fit border py-2 px-3 rounded-xl flex flex-row items-start justify-between gap-3"
      onClick={(event) => {
        if (isReadonly) {
          toast.error(t('documentTool.viewingNotSupported'));
          return;
        }

        router.push(`/artifact?cid=${chatId}`);
      }}
    >
      <div className="flex flex-row gap-3 items-start">
        <div className="text-zinc-500 mt-1">
          {type === 'create' ? (
            <FileIcon />
          ) : type === 'update' ? (
            <PencilEditIcon />
          ) : type === 'request-suggestions' ? (
            <MessageIcon />
          ) : null}
        </div>

        <div className="text-left">
          {`${getActionText(type, 'present', t)} ${args.title ? `"${args.title}"` : ''}`}
        </div>
      </div>

      <div className="animate-spin mt-1">{<LoaderIcon />}</div>
    </button>
  );
}

export const DocumentToolCall = memo(PureDocumentToolCall, () => true);
