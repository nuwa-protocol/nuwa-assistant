// document-store.ts
// Store for managing documents, suggestions, and artifacts with IndexedDB persistence
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { generateUUID } from '@/lib/utils';
// eslint-disable-next-line import/no-named-as-default
import Dexie, { type Table } from 'dexie';
import { useCallback } from 'react';
import { useDIDStore } from './did-store';

// ================= Interfaces ================= //

// Document interface
export interface ClientDocument {
  id: string;
  did?: string;
  title: string;
  content: string | null;
  kind: 'text' | 'code' | 'image' | 'sheet';
  createdAt: number;
  updatedAt: number;
}

// Suggestion interface
export interface ClientSuggestion {
  id: string;
  did?: string;
  documentId: string;
  originalText: string;
  suggestedText: string;
  description?: string;
  isResolved: boolean;
  createdAt: number;
}

// Artifact interface (merged from use-artifact.ts)
export interface UIArtifact {
  documentId: string;
  content: string;
  kind: 'text' | 'code' | 'image' | 'sheet';
  title: string;
  status: 'streaming' | 'idle' | 'loading' | 'error' | 'success';
  isVisible: boolean;
  boundingBox: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

// ================= Constants ================= //

// Initial artifact data
export const initialArtifactData: UIArtifact = {
  documentId: 'init',
  content: '',
  kind: 'text',
  title: '',
  status: 'idle',
  isVisible: false,
  boundingBox: {
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  },
};

// ================= Database Definition ================= //

class DocumentDatabase extends Dexie {
  documents!: Table<ClientDocument>;
  suggestions!: Table<ClientSuggestion>;

  constructor() {
    if (typeof window === 'undefined') {
      // return a dummy Dexie instance on the server side
      super('dummy');
      return;
    }
    super('DocumentDatabase');
    this.version(1).stores({
      documents: 'id, did, createdAt, updatedAt, kind',
      suggestions: 'id, did, documentId, createdAt, isResolved',
    });
  }
}

const documentDB = new DocumentDatabase();

// ================= Store State Interface ================= //

interface DocumentStoreState {
  documents: Record<string, ClientDocument>;
  suggestions: Record<string, ClientSuggestion>;

  // Artifact state (merged from use-artifact.ts)
  currentArtifact: UIArtifact;
  artifactMetadata: Record<string, any>;

  // Document management
  createDocument: (title: string, kind: ClientDocument['kind']) => string;
  createDocumentWithId: (
    id: string,
    title: string,
    kind: ClientDocument['kind'],
    content?: string,
  ) => void;
  getDocument: (id: string) => ClientDocument | null;
  updateDocument: (
    id: string,
    updates: Partial<Omit<ClientDocument, 'id' | 'createdAt'>>,
  ) => void;
  deleteDocument: (id: string) => void;
  setDocumentContent: (id: string, content: string) => void;

  // Suggestion management
  createSuggestion: (
    documentId: string,
    originalText: string,
    suggestedText: string,
    description?: string,
  ) => string;
  getSuggestionsByDocument: (documentId: string) => ClientSuggestion[];
  updateSuggestion: (
    id: string,
    updates: Partial<Omit<ClientSuggestion, 'id' | 'createdAt'>>,
  ) => void;
  resolveSuggestion: (id: string) => void;
  deleteSuggestion: (id: string) => void;

  // Artifact management (merged from use-artifact.ts)
  setArtifact: (
    updaterFn: UIArtifact | ((currentArtifact: UIArtifact) => UIArtifact),
  ) => void;
  updateArtifact: (updates: Partial<UIArtifact>) => void;
  setArtifactMetadata: (documentId: string, metadata: any) => void;
  getArtifactMetadata: (documentId: string) => any;
  resetArtifact: () => void;

  // Artifact selectors
  selectArtifact: <T>(selector: (artifact: UIArtifact) => T) => T;

  // Utility methods
  getSortedDocuments: () => ClientDocument[];
  clearAllDocuments: () => void;
  clearAllSuggestions: () => void;

  // Data persistence
  loadFromDB: () => Promise<void>;
  saveToDB: () => Promise<void>;
}

// ================= Environment & Storage ================= //

const isBrowser = typeof window !== 'undefined';

// Custom storage adapter
const persistStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (!isBrowser) return null;
    try {
      return localStorage.getItem(name);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (!isBrowser) return;
    try {
      localStorage.setItem(name, value);
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    if (!isBrowser) return;
    try {
      localStorage.removeItem(name);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
};

// ================= Store Definition ================= //

export const useDocumentStore = create<DocumentStoreState>()(
  persist(
    (set, get) => ({
      // Store state
      documents: {},
      suggestions: {},
      currentArtifact: initialArtifactData,
      artifactMetadata: {},

      // Document creation and management
      createDocument: (title: string, kind: ClientDocument['kind']) => {
        const id = generateUUID();
        const now = Date.now();
        const currentDID = useDIDStore.getState().did || '';

        const newDocument: ClientDocument = {
          id,
          did: currentDID,
          title,
          content: null,
          kind,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          documents: {
            ...state.documents,
            [id]: newDocument,
          },
        }));

        // save to IndexedDB asynchronously
        get().saveToDB();
        return id;
      },

      createDocumentWithId: (
        id: string,
        title: string,
        kind: ClientDocument['kind'],
        content?: string,
      ) => {
        const now = Date.now();
        const currentDID = useDIDStore.getState().did || '';

        const newDocument: ClientDocument = {
          id,
          did: currentDID,
          title,
          content: content || null,
          kind,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          documents: {
            ...state.documents,
            [id]: newDocument,
          },
        }));

        // save to IndexedDB asynchronously
        get().saveToDB();
      },

      getDocument: (id: string) => {
        const { documents } = get();
        return documents[id] || null;
      },

      updateDocument: (
        id: string,
        updates: Partial<Omit<ClientDocument, 'id' | 'createdAt'>>,
      ) => {
        set((state) => {
          const document = state.documents[id];
          if (!document) return state;

          const updatedDocument = {
            ...document,
            ...updates,
            updatedAt: Date.now(),
          };

          return {
            documents: {
              ...state.documents,
              [id]: updatedDocument,
            },
          };
        });

        get().saveToDB();
      },

      deleteDocument: (id: string) => {
        set((state) => {
          const { [id]: deleted, ...restDocuments } = state.documents;

          // delete related suggestions
          const filteredSuggestions = Object.fromEntries(
            Object.entries(state.suggestions).filter(
              ([_, suggestion]) => suggestion.documentId !== id,
            ),
          );

          return {
            documents: restDocuments,
            suggestions: filteredSuggestions,
          };
        });

        // delete related data asynchronously
        const deleteFromDB = async () => {
          try {
            await documentDB.documents.delete(id);
            await documentDB.suggestions
              .where('documentId')
              .equals(id)
              .delete();
          } catch (error) {
            console.error('Failed to delete from DB:', error);
          }
        };
        deleteFromDB();
      },

      setDocumentContent: (id: string, content: string) => {
        get().updateDocument(id, { content });
      },

      createSuggestion: (
        documentId: string,
        originalText: string,
        suggestedText: string,
        description?: string,
      ) => {
        const id = generateUUID();
        const currentDID = useDIDStore.getState().did || '';

        const newSuggestion: ClientSuggestion = {
          id,
          did: currentDID,
          documentId,
          originalText,
          suggestedText,
          description,
          isResolved: false,
          createdAt: Date.now(),
        };

        set((state) => ({
          suggestions: {
            ...state.suggestions,
            [id]: newSuggestion,
          },
        }));

        // save suggestion to IndexedDB asynchronously
        const saveSuggestionToDB = async () => {
          try {
            await documentDB.suggestions.add(newSuggestion);
          } catch (error) {
            console.error('Failed to save suggestion to DB:', error);
          }
        };
        saveSuggestionToDB();

        return id;
      },

      getSuggestionsByDocument: (documentId: string) => {
        const { suggestions } = get();
        return Object.values(suggestions)
          .filter((suggestion) => suggestion.documentId === documentId)
          .sort((a, b) => b.createdAt - a.createdAt);
      },

      updateSuggestion: (
        id: string,
        updates: Partial<Omit<ClientSuggestion, 'id' | 'createdAt'>>,
      ) => {
        set((state) => {
          const suggestion = state.suggestions[id];
          if (!suggestion) return state;

          const updatedSuggestion = {
            ...suggestion,
            ...updates,
          };

          return {
            suggestions: {
              ...state.suggestions,
              [id]: updatedSuggestion,
            },
          };
        });

        // save to IndexedDB asynchronously
        const saveSuggestionToDB = async () => {
          try {
            const { suggestions } = get();
            const suggestion = suggestions[id];
            if (suggestion) {
              await documentDB.suggestions.put(suggestion);
            }
          } catch (error) {
            console.error('Failed to save suggestion to DB:', error);
          }
        };
        saveSuggestionToDB();
      },

      resolveSuggestion: (id: string) => {
        get().updateSuggestion(id, { isResolved: true });
      },

      deleteSuggestion: (id: string) => {
        set((state) => {
          const { [id]: deleted, ...restSuggestions } = state.suggestions;
          return {
            suggestions: restSuggestions,
          };
        });

        // delete asynchronously
        const deleteFromDB = async () => {
          try {
            await documentDB.suggestions.delete(id);
          } catch (error) {
            console.error('Failed to delete suggestion from DB:', error);
          }
        };
        deleteFromDB();
      },

      // Artifact management methods (merged from use-artifact.ts)
      setArtifact: (
        updaterFn: UIArtifact | ((currentArtifact: UIArtifact) => UIArtifact),
      ) => {
        set((state) => {
          const newArtifact =
            typeof updaterFn === 'function'
              ? updaterFn(state.currentArtifact)
              : updaterFn;

          return {
            currentArtifact: newArtifact,
          };
        });
      },

      updateArtifact: (updates: Partial<UIArtifact>) => {
        set((state) => ({
          currentArtifact: {
            ...state.currentArtifact,
            ...updates,
          },
        }));
      },

      setArtifactMetadata: (documentId: string, metadata: any) => {
        set((state) => ({
          artifactMetadata: {
            ...state.artifactMetadata,
            [documentId]: metadata,
          },
        }));
      },

      getArtifactMetadata: (documentId: string) => {
        const { artifactMetadata } = get();
        return artifactMetadata[documentId] || null;
      },

      resetArtifact: () => {
        set({
          currentArtifact: initialArtifactData,
        });
      },

      selectArtifact: <T>(selector: (artifact: UIArtifact) => T): T => {
        const { currentArtifact } = get();
        return selector(currentArtifact);
      },

      getSortedDocuments: () => {
        const { documents } = get();
        return Object.values(documents).sort(
          (a, b) => b.updatedAt - a.updatedAt,
        );
      },

      clearAllDocuments: () => {
        set({
          documents: {},
        });

        // clear IndexedDB
        const clearDB = async () => {
          try {
            const currentDID = useDIDStore.getState().did;
            if (!currentDID) return;

            await documentDB.documents.where('did').equals(currentDID).delete();
          } catch (error) {
            console.error('Failed to clear documents from DB:', error);
          }
        };
        clearDB();
      },

      clearAllSuggestions: () => {
        set({
          suggestions: {},
        });

        // clear IndexedDB
        const clearDB = async () => {
          try {
            const currentDID = useDIDStore.getState().did;
            if (!currentDID) return;

            await documentDB.suggestions
              .where('did')
              .equals(currentDID)
              .delete();
          } catch (error) {
            console.error('Failed to clear suggestions from DB:', error);
          }
        };
        clearDB();
      },

      loadFromDB: async () => {
        if (typeof window === 'undefined') return;

        try {
          const currentDID = useDIDStore.getState().did;
          if (!currentDID) return;

          const [documents, suggestions] = await Promise.all([
            documentDB.documents.where('did').equals(currentDID).toArray(),
            documentDB.suggestions.where('did').equals(currentDID).toArray(),
          ]);

          const documentsMap: Record<string, ClientDocument> = {};
          const suggestionsMap: Record<string, ClientSuggestion> = {};

          documents.forEach((doc) => {
            documentsMap[doc.id] = doc;
          });

          suggestions.forEach((suggestion) => {
            suggestionsMap[suggestion.id] = suggestion;
          });

          set((state) => ({
            documents: { ...state.documents, ...documentsMap },
            suggestions: { ...state.suggestions, ...suggestionsMap },
          }));
        } catch (error) {
          console.error('Failed to load from DB:', error);
        }
      },

      saveToDB: async () => {
        if (typeof window === 'undefined') return;

        try {
          const { documents, suggestions } = get();
          const documentsToSave = Object.values(documents);
          const suggestionsToSave = Object.values(suggestions);

          await Promise.all([
            documentDB.documents.bulkPut(documentsToSave),
            documentDB.suggestions.bulkPut(suggestionsToSave),
          ]);
        } catch (error) {
          console.error('Failed to save to DB:', error);
        }
      },
    }),
    {
      name: `document-storage-${useDIDStore.getState().did}`,
      storage: createJSONStorage(() => persistStorage),
      partialize: (state) => ({
        documents: state.documents,
        suggestions: state.suggestions,
        currentArtifact: state.currentArtifact,
        artifactMetadata: state.artifactMetadata,
      }),
      onRehydrateStorage: () => (state) => {
        // load data from IndexedDB after component mount
        if (state) {
          state.loadFromDB();
        }
      },
    },
  ),
);

// ================= Exported Utilities ================= //

export const updateGlobalArtifact = (
  updaterFn: UIArtifact | ((currentArtifact: UIArtifact) => UIArtifact),
) => {
  useDocumentStore.getState().setArtifact(updaterFn);
};

// ================= React Hooks ================= //

export const useArtifact = () => {
  const store = useDocumentStore();
  const documentId = store.currentArtifact.documentId;

  // Use useCallback to stabilize the setMetadata function
  // The function should always use the current documentId from the store
  const setMetadata = useCallback((metadata: any) => {
    const currentDocumentId =
      useDocumentStore.getState().currentArtifact.documentId;
    useDocumentStore
      .getState()
      .setArtifactMetadata(currentDocumentId, metadata);
  }, []);

  return {
    artifact: store.currentArtifact,
    setArtifact: store.setArtifact,
    updateArtifact: store.updateArtifact,
    metadata: store.getArtifactMetadata(documentId),
    setMetadata,
    resetArtifact: store.resetArtifact,
  };
};

export const useArtifactSelector = <T>(
  selector: (artifact: UIArtifact) => T,
): T => {
  return useDocumentStore((state) => selector(state.currentArtifact));
};
