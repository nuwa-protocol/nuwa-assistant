// file-store.ts
// Client-side file storage system using IndexedDB for file data and local storage for metadata
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { generateUUID } from '@/utils';
// eslint-disable-next-line import/no-named-as-default
import Dexie, { type Table } from 'dexie';
import { useDIDStore } from './did-store';

// ================= Constants & Types ================= //

// Supported file types
export const SUPPORTED_FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENT: ['application/pdf', 'text/plain', 'application/msword'],
  ALL: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
  ],
} as const;

// Maximum file size (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// ================= Interfaces ================= //

// File metadata interface
export interface StoredFile {
  id: string;
  did: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: number;
}

// File data interface (including actual Blob data)
export interface FileData {
  id: string;
  blob: Blob;
}

// File validation result interface
interface ValidationResult {
  valid: boolean;
  error?: string;
}

// File store state interface
interface FileStoreState {
  files: Record<string, StoredFile>;

  // File validation
  validateFile: (file: File) => ValidationResult;

  // File management
  uploadFile: (file: File) => Promise<StoredFile>;
  getFile: (id: string) => StoredFile | null;
  getFileBlob: (id: string) => Promise<Blob | null>;
  getFileURL: (id: string) => Promise<string | null>;
  deleteFile: (id: string) => Promise<void>;

  // File queries
  getAllFiles: () => StoredFile[];
  getFilesByType: (type: string) => StoredFile[];
  getTotalSize: () => number;

  // Cleanup operations
  clearAllFiles: () => Promise<void>;

  // Data persistence
  loadFromDB: () => Promise<void>;
  saveToDB: () => Promise<void>;
}

// ================= Database Definition ================= //

class FileDatabase extends Dexie {
  fileData!: Table<FileData>;
  files!: Table<StoredFile>;

  constructor() {
    if (typeof window === 'undefined') {
      // return a dummy Dexie instance on server side
      super('dummy');
      return;
    }
    super('FileDatabase');
    this.version(1).stores({
      fileData: 'id',
      files: 'id, did, uploadedAt',
    });
  }
}

const fileDB = new FileDatabase();

// ================= Environment & Storage ================= //

const isBrowser = typeof window !== 'undefined';

// Custom storage adapter (for metadata only)
const persistStorage = {
  getItem: (name: string): string | null => {
    if (!isBrowser) return null;
    try {
      return localStorage.getItem(name);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    if (!isBrowser) return;
    try {
      localStorage.setItem(name, value);
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },
  removeItem: (name: string): void => {
    if (!isBrowser) return;
    try {
      localStorage.removeItem(name);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
};

// ================= Store Definition ================= //

export const useFileStore = create<FileStoreState>()(
  persist(
    (set, get) => ({
      // Store state
      files: {},

      // File validation
      validateFile: (file: File): ValidationResult => {
        // Check file size
        if (file.size > MAX_FILE_SIZE) {
          return {
            valid: false,
            error: `File size should be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          };
        }

        // Check file type
        if (!SUPPORTED_FILE_TYPES.ALL.includes(file.type as any)) {
          return {
            valid: false,
            error: `File type ${file.type} is not supported`,
          };
        }

        return { valid: true };
      },

      // File upload and management
      uploadFile: async (file: File): Promise<StoredFile> => {
        const validation = get().validateFile(file);
        if (!validation.valid) {
          throw new Error(validation.error);
        }

        const id = generateUUID();
        const currentDID = useDIDStore.getState().did || '';
        const storedFile: StoredFile = {
          id,
          did: currentDID,
          name: file.name,
          type: file.type,
          size: file.size,
          uploadedAt: Date.now(),
        };

        try {
          // Save file data to IndexedDB
          await fileDB.fileData.add({
            id,
            blob: file,
          });

          // Save metadata to state
          set((state) => ({
            files: {
              ...state.files,
              [id]: storedFile,
            },
          }));

          return storedFile;
        } catch (error) {
          console.error('Failed to upload file:', error);
          throw new Error('Failed to save file');
        }
      },

      // File retrieval methods
      getFile: (id: string): StoredFile | null => {
        const { files } = get();
        return files[id] || null;
      },

      getFileBlob: async (id: string): Promise<Blob | null> => {
        try {
          const fileData = await fileDB.fileData.get(id);
          return fileData?.blob || null;
        } catch (error) {
          console.error('Failed to get file blob:', error);
          return null;
        }
      },

      getFileURL: async (id: string): Promise<string | null> => {
        try {
          const blob = await get().getFileBlob(id);
          if (blob) {
            return URL.createObjectURL(blob);
          }
          return null;
        } catch (error) {
          console.error('Failed to create file URL:', error);
          return null;
        }
      },

      // File deletion
      deleteFile: async (id: string): Promise<void> => {
        try {
          // Delete file data from IndexedDB
          await fileDB.fileData.delete(id);
          await fileDB.files.delete(id);

          // Delete metadata from state
          set((state) => {
            const { [id]: deleted, ...restFiles } = state.files;
            return { files: restFiles };
          });
        } catch (error) {
          console.error('Failed to delete file:', error);
          throw new Error('Failed to delete file');
        }
      },

      // File listing and filtering
      getAllFiles: (): StoredFile[] => {
        const { files } = get();
        return Object.values(files).sort((a, b) => b.uploadedAt - a.uploadedAt);
      },

      getFilesByType: (type: string): StoredFile[] => {
        const { files } = get();
        return Object.values(files)
          .filter((file) => file.type.startsWith(type))
          .sort((a, b) => b.uploadedAt - a.uploadedAt);
      },

      // File queries
      getTotalSize: (): number => {
        const { files } = get();
        return Object.values(files).reduce(
          (total, file) => total + file.size,
          0,
        );
      },

      // Cleanup operations
      clearAllFiles: async (): Promise<void> => {
        try {
          await fileDB.fileData.clear();
          set({ files: {} });
        } catch (error) {
          console.error('Failed to clear files:', error);
          throw new Error('Failed to clear files');
        }
      },

      // Data persistence
      loadFromDB: async () => {
        if (typeof window === 'undefined') return;

        try {
          const currentDID = useDIDStore.getState().did;
          if (!currentDID) return;

          const files = await fileDB.files
            .where('did')
            .equals(currentDID)
            .toArray();

          const filesMap: Record<string, StoredFile> = {};
          files.forEach((file) => {
            filesMap[file.id] = file;
          });

          set((state) => ({
            files: { ...state.files, ...filesMap },
          }));
        } catch (error) {
          console.error('Failed to load from DB:', error);
        }
      },

      saveToDB: async () => {
        if (typeof window === 'undefined') return;

        try {
          const { files } = get();
          const filesToSave = Object.values(files);

          // Use bulkPut to efficiently update data
          await fileDB.files.bulkPut(filesToSave);
        } catch (error) {
          console.error('Failed to save to DB:', error);
        }
      },
    }),
    {
      name: `file-storage-${useDIDStore.getState().did}`,
      storage: createJSONStorage(() => persistStorage),
      partialize: (state) => ({
        files: state.files,
      }),
      onRehydrateStorage: () => (state) => {
        // Load data from IndexedDB after component mount
        if (state) {
          state.loadFromDB();
        }
      },
    },
  ),
);

// ================= Utility Functions ================= //

// 工具函数：格式化文件大小
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// 工具函数：检查是否为图片文件
export function isImageFile(file: StoredFile): boolean {
  return SUPPORTED_FILE_TYPES.IMAGE.includes(file.type as any);
}

// 工具函数：获取文件图标
export function getFileIcon(file: StoredFile): string {
  if (isImageFile(file)) return '🖼️';
  if (file.type === 'application/pdf') return '📄';
  if (file.type.startsWith('text/')) return '��';
  return '📎';
}
