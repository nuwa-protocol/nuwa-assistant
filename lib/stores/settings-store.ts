import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DEFAULT_CHAT_MODEL, ChatModel, chatModels } from '@/lib/ai/models';

// 设置接口
interface SettingsState {
  // 聊天设置
  selectedChatModel: ChatModel;
  
  // 设置管理方法
  setChatModel: (id: string) => void;
  
  // 重置设置
  resetSettings: () => void;
}

const isBrowser = typeof window !== 'undefined';

// 自定义存储适配器
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

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      selectedChatModel: chatModels.find((m) => m.id === DEFAULT_CHAT_MODEL)!,

      setChatModel: (id: string) => {
        const model = chatModels.find((m) => m.id === id);
        if (model) {
          set({ selectedChatModel: model });
        }
      },

      resetSettings: () => {
        set({
          selectedChatModel: chatModels.find((m) => m.id === DEFAULT_CHAT_MODEL)!,
        });
      },
    }),
    {
      name: 'user-settings-storage',
      storage: createJSONStorage(() => persistStorage),
      partialize: (state) => ({
        selectedChatModel: state.selectedChatModel,
      }),
    }
  )
);

// 向后兼容的函数，替换原来的 saveChatModelAsCookie
export function saveChatModel(id: string) {
  useSettingsStore.getState().setChatModel(id);
}

// 获取当前选择的聊天模型
export function getCurrentChatModel(): ChatModel {
  return useSettingsStore.getState().selectedChatModel;
} 