import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { generateUUID } from '@/lib/utils';
import Dexie, { type Table } from 'dexie';

/**
 * 客户端文件存储系统
 * 使用 IndexedDB 存储文件数据，支持图片预览和文件管理
 */

// 支持的文件类型
export const SUPPORTED_FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENT: ['application/pdf', 'text/plain', 'application/msword'],
  ALL: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain']
} as const;

// 最大文件大小 (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// 文件元数据接口
export interface StoredFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: number;
}

// 文件数据接口（包含实际的 Blob 数据）
export interface FileData {
  id: string;
  blob: Blob;
}

// Dexie 数据库定义
class FileDatabase extends Dexie {
  fileData!: Table<FileData>;

  constructor() {
    super('FileDatabase');
    this.version(1).stores({
      fileData: 'id'
    });
  }
}

const fileDB = new FileDatabase();

// 文件验证结果接口
interface ValidationResult {
  valid: boolean;
  error?: string;
}

// 文件存储状态接口
interface FileStoreState {
  files: Record<string, StoredFile>;

  // 文件验证
  validateFile: (file: File) => ValidationResult;

  // 文件管理
  uploadFile: (file: File) => Promise<StoredFile>;
  getFile: (id: string) => StoredFile | null;
  getFileBlob: (id: string) => Promise<Blob | null>;
  getFileURL: (id: string) => Promise<string | null>;
  deleteFile: (id: string) => Promise<void>;

  // 文件查询
  getAllFiles: () => StoredFile[];
  getFilesByType: (type: string) => StoredFile[];
  getTotalSize: () => number;

  // 清理操作
  clearAllFiles: () => Promise<void>;
}


const isBrowser = typeof window !== 'undefined';

// 自定义存储适配器（仅用于元数据）
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

// 创建文件存储
export const useFileStore = create<FileStoreState>()(
  persist(
    (set, get) => ({
      files: {},

      validateFile: (file: File): ValidationResult => {
        // 检查文件大小
        if (file.size > MAX_FILE_SIZE) {
          return {
            valid: false,
            error: `File size should be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`
          };
        }

        // 检查文件类型
        if (!SUPPORTED_FILE_TYPES.ALL.includes(file.type as any)) {
          return {
            valid: false,
            error: `File type ${file.type} is not supported`
          };
        }

        return { valid: true };
      },

      uploadFile: async (file: File): Promise<StoredFile> => {
        const validation = get().validateFile(file);
        if (!validation.valid) {
          throw new Error(validation.error);
        }

        const id = generateUUID();
        const storedFile: StoredFile = {
          id,
          name: file.name,
          type: file.type,
          size: file.size,
          uploadedAt: Date.now(),
        };

        try {
          // 保存文件数据到 IndexedDB
          await fileDB.fileData.add({
            id,
            blob: file
          });

          // 保存元数据到状态
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

      deleteFile: async (id: string): Promise<void> => {
        try {
          // 删除 IndexedDB 中的文件数据
          await fileDB.fileData.delete(id);

          // 删除状态中的元数据
          set((state) => {
            const { [id]: deleted, ...restFiles } = state.files;
            return { files: restFiles };
          });
        } catch (error) {
          console.error('Failed to delete file:', error);
          throw new Error('Failed to delete file');
        }
      },

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

      getTotalSize: (): number => {
        const { files } = get();
        return Object.values(files).reduce((total, file) => total + file.size, 0);
      },

      clearAllFiles: async (): Promise<void> => {
        try {
          await fileDB.fileData.clear();
          set({ files: {} });
        } catch (error) {
          console.error('Failed to clear files:', error);
          throw new Error('Failed to clear files');
        }
      },
    }),
    {
      name: 'file-metadata-storage',
      storage: createJSONStorage(() => persistStorage),
      partialize: (state) => ({
        files: state.files,
      }),
    }
  )
);

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