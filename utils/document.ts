import type { ClientDocument } from '@/stores/document-store';

function getDocumentTimestampByIndex(
  documents: Array<ClientDocument>,
  index: number,
) {
  if (!documents) return new Date();
  if (index > documents.length) return new Date();

  return new Date(documents[index].createdAt);
}

export { getDocumentTimestampByIndex };
