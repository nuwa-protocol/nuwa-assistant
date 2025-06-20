'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useWindowSize } from 'usehooks-ts';
import { useLocale } from '@/locales/use-locale';

import { useDocumentStore, type ClientDocument } from '@/stores/document-store';

import { LoaderIcon } from './icons';
import { Button } from './ui/button';
import { useCurrentArtifact } from '@/hooks/use-artifact';

interface VersionFooterProps {
  handleVersionChange: (type: 'next' | 'prev' | 'toggle' | 'latest') => void;
  documents: Array<ClientDocument> | undefined;
  currentVersionIndex: number;
}

export const VersionFooter = ({
  handleVersionChange,
  documents,
  currentVersionIndex,
}: VersionFooterProps) => {
  const { artifact } = useCurrentArtifact();
  const { deleteDocument, deleteDocumentAfter } = useDocumentStore();
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const [isMutating, setIsMutating] = useState(false);
  const { t } = useLocale();

  if (!documents) return;

  return (
    <motion.div
      className="absolute flex flex-col gap-4 lg:flex-row bottom-0 bg-background p-4 w-full border-t z-50 justify-between"
      initial={{ y: isMobile ? 200 : 77 }}
      animate={{ y: 0 }}
      exit={{ y: isMobile ? 200 : 77 }}
      transition={{ type: 'spring', stiffness: 140, damping: 20 }}
    >
      <div>
        <div>{t('version.viewingPrevious')}</div>
        <div className="text-muted-foreground text-sm">
          {t('version.restoreToEdit')}
        </div>
      </div>

      <div className="flex flex-row gap-4">
        <Button
          disabled={isMutating}
          onClick={async () => {
            setIsMutating(true);

            try {
              // Get the current version's content
              const currentDocument = documents[currentVersionIndex];
              if (currentDocument) {
                // Update document to the selected version's content
                await deleteDocumentAfter(artifact.documentId, {
                  content: currentDocument.content ?? '',
                  createdAt: currentDocument.createdAt,
                });

                // Go back to latest version
                handleVersionChange('latest');
              }
            } catch (error) {
              console.error(t('version.failedRestore'), error);
            } finally {
              setIsMutating(false);
            }
          }}
        >
          <div>{t('version.restore')}</div>
          {isMutating && (
            <div className="animate-spin">
              <LoaderIcon />
            </div>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            handleVersionChange('latest');
          }}
        >
          {t('version.backToLatest')}
        </Button>
      </div>
    </motion.div>
  );
};
