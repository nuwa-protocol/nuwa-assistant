import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { generateUUID } from "@/lib/utils";
import Dexie, { type Table } from "dexie";

// document interface
export interface ClientDocument {
  id: string;
  title: string;
  content: string | null;
  kind: "text" | "code" | "image" | "sheet";
  createdAt: number;
  updatedAt: number;
}

// suggestion interface
export interface ClientSuggestion {
  id: string;
  documentId: string;
  originalText: string;
  suggestedText: string;
  description?: string;
  isResolved: boolean;
  createdAt: number;
}

// Dexie database definition
class DocumentDatabase extends Dexie {
  documents!: Table<ClientDocument>;
  suggestions!: Table<ClientSuggestion>;

  constructor() {
    if (typeof window === "undefined") {
      // return a dummy Dexie instance on the server side
      super("dummy");
      return;
    }
    super("DocumentDatabase");
    this.version(1).stores({
      documents: "id, createdAt, updatedAt, kind",
      suggestions: "id, documentId, createdAt, isResolved",
    });
  }
}

const documentDB = new DocumentDatabase();

// document store state interface
interface DocumentStoreState {
  documents: Record<string, ClientDocument>;
  suggestions: Record<string, ClientSuggestion>;

  // document management
  createDocument: (title: string, kind: ClientDocument["kind"]) => string;
  createDocumentWithId: (
    id: string,
    title: string,
    kind: ClientDocument["kind"],
    content?: string
  ) => void;
  getDocument: (id: string) => ClientDocument | null;
  updateDocument: (
    id: string,
    updates: Partial<Omit<ClientDocument, "id" | "createdAt">>
  ) => void;
  deleteDocument: (id: string) => void;
  setDocumentContent: (id: string, content: string) => void;

  // suggestion management
  createSuggestion: (
    documentId: string,
    originalText: string,
    suggestedText: string,
    description?: string
  ) => string;
  getSuggestionsByDocument: (documentId: string) => ClientSuggestion[];
  updateSuggestion: (
    id: string,
    updates: Partial<Omit<ClientSuggestion, "id" | "createdAt">>
  ) => void;
  resolveSuggestion: (id: string) => void;
  deleteSuggestion: (id: string) => void;

  // utility methods
  getSortedDocuments: () => ClientDocument[];
  clearAllDocuments: () => void;
  clearAllSuggestions: () => void;

  // data persistence
  loadFromDB: () => Promise<void>;
  saveToDB: () => Promise<void>;
}

const isBrowser = typeof window !== "undefined";

// custom storage adapter
const persistStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (!isBrowser) return null;
    try {
      return localStorage.getItem(name);
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (!isBrowser) return;
    try {
      localStorage.setItem(name, value);
    } catch (error) {
      console.error("Error writing to localStorage:", error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    if (!isBrowser) return;
    try {
      localStorage.removeItem(name);
    } catch (error) {
      console.error("Error removing from localStorage:", error);
    }
  },
};

export const useDocumentStore = create<DocumentStoreState>()(
  persist(
    (set, get) => ({
      documents: {},
      suggestions: {},

      createDocument: (title: string, kind: ClientDocument["kind"]) => {
        const id = generateUUID();
        const now = Date.now();

        const newDocument: ClientDocument = {
          id,
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
        kind: ClientDocument["kind"],
        content?: string
      ) => {
        const now = Date.now();

        const newDocument: ClientDocument = {
          id,
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
        updates: Partial<Omit<ClientDocument, "id" | "createdAt">>
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
              ([_, suggestion]) => suggestion.documentId !== id
            )
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
              .where("documentId")
              .equals(id)
              .delete();
          } catch (error) {
            console.error("Failed to delete from DB:", error);
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
        description?: string
      ) => {
        const id = generateUUID();

        const newSuggestion: ClientSuggestion = {
          id,
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
            console.error("Failed to save suggestion to DB:", error);
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
        updates: Partial<Omit<ClientSuggestion, "id" | "createdAt">>
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
            console.error("Failed to save suggestion to DB:", error);
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
            console.error("Failed to delete suggestion from DB:", error);
          }
        };
        deleteFromDB();
      },

      getSortedDocuments: () => {
        const { documents } = get();
        return Object.values(documents).sort(
          (a, b) => b.updatedAt - a.updatedAt
        );
      },

      clearAllDocuments: () => {
        set({
          documents: {},
        });

        // clear IndexedDB
        const clearDB = async () => {
          try {
            await documentDB.documents.clear();
          } catch (error) {
            console.error("Failed to clear documents from DB:", error);
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
            await documentDB.suggestions.clear();
          } catch (error) {
            console.error("Failed to clear suggestions from DB:", error);
          }
        };
        clearDB();
      },

      loadFromDB: async () => {
        if (typeof window === "undefined") return;

        try {
          const [documents, suggestions] = await Promise.all([
            documentDB.documents.toArray(),
            documentDB.suggestions.toArray(),
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
          console.error("Failed to load from DB:", error);
        }
      },

      saveToDB: async () => {
        if (typeof window === "undefined") return;

        try {
          const { documents, suggestions } = get();
          const documentsToSave = Object.values(documents);
          const suggestionsToSave = Object.values(suggestions);

          await Promise.all([
            documentDB.documents.bulkPut(documentsToSave),
            documentDB.suggestions.bulkPut(suggestionsToSave),
          ]);
        } catch (error) {
          console.error("Failed to save to DB:", error);
        }
      },
    }),
    {
      name: "document-storage",
      storage: createJSONStorage(() => persistStorage),
      partialize: (state) => ({
        documents: state.documents,
        suggestions: state.suggestions,
      }),
      onRehydrateStorage: () => (state) => {
        // load data from IndexedDB after component mount
        if (state) {
          state.loadFromDB();
        }
      },
    }
  )
);
