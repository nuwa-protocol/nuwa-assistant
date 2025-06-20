import { useDocumentStore } from '@/stores/document-store';
import { useCallback } from 'react';

export const useCurrentArtifact = () => {
  const store = useDocumentStore();
  const documentId = store.currentArtifact.documentId;

  // Use useCallback to stabilize the setMetadata function
  // The function should always use the current documentId from the store
  const setMetadata = useCallback((metadata: any) => {
    const currentDocumentId =
      useDocumentStore.getState().currentArtifact.documentId;
    useDocumentStore.getState().setArtifactMetadata(metadata);
  }, []);

  return {
    artifact: store.currentArtifact,
    setArtifact: store.setArtifact,
    updateArtifact: store.updateArtifact,
    metadata: store.getArtifactMetadata(),
    setMetadata,
    resetArtifact: store.resetArtifact,
  };
};
