import { memo } from 'react';
import { CrossIcon } from './icons';
import { Button } from './ui/button';
import { initialArtifactData, useDocumentStore } from '@/stores/document-store';
import { useRouter } from 'next/navigation';

function PureArtifactCloseButton({ chatId }: { chatId: string }) {
  const { setArtifact } = useDocumentStore();
  const router = useRouter();
  return (
    <Button
      data-testid="artifact-close-button"
      variant="outline"
      className="h-fit p-2 dark:hover:bg-zinc-700"
      onClick={() => {
        router.push(`/chat?cid=${chatId}`);
        setArtifact((currentArtifact) =>
          currentArtifact.status === 'streaming'
            ? {
                ...currentArtifact,
              }
            : { ...initialArtifactData, status: 'idle' },
        );
      }}
    >
      <CrossIcon size={18} />
    </Button>
  );
}

export const ArtifactCloseButton = memo(PureArtifactCloseButton, () => true);
