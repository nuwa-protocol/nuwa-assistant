import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { generateUUID } from '@/lib/utils';
import type { UIMessage } from 'ai';
import Dexie, { type Table } from 'dexie';

// 客户端聊天接口
export interface ClientChat {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: UIMessage[];
}

// 流 ID 管理接口
export interface StreamRecord {
  id: string;
  chatId: string;
  createdAt: number;
}

// Dexie 数据库定义
class ChatDatabase extends Dexie {
  chats!: Table<ClientChat>;
  streams!: Table<StreamRecord>;

  constructor() {
    super('ChatDatabase');
    this.version(1).stores({
      chats: 'id, createdAt, updatedAt',
      streams: 'id, chatId, createdAt'
    });
  }
}

const chatDB = new ChatDatabase();

// 聊天存储状态接口
interface ChatStoreState {
  sessions: Record<string, ClientChat>;
  currentSessionId: string | null;

  // 会话管理
  createSession: () => string;
  getSession: (id: string) => ClientChat | null;
  updateSession: (id: string, updates: Partial<Omit<ClientChat, 'id'>>) => void;
  deleteSession: (id: string) => void;
  setCurrentSession: (id: string | null) => void;
  
  // 消息管理
  addMessage: (sessionId: string, message: UIMessage) => void;
  updateMessage: (sessionId: string, messageId: string, updates: Partial<UIMessage>) => void;
  deleteMessage: (sessionId: string, messageId: string) => void;
  deleteMessagesAfterTimestamp: (sessionId: string, timestamp: number) => void;
  getMessages: (sessionId: string) => UIMessage[];
  
  // 流管理
  createStreamId: (streamId: string, chatId: string) => Promise<void>;
  getStreamIdsByChatId: (chatId: string) => Promise<string[]>;
  
  // 工具方法
  getSortedSessions: () => ClientChat[];
  generateTitle: (messages: UIMessage[]) => string;
  clearAllSessions: () => void;
  
  // 数据持久化
  loadFromDB: () => Promise<void>;
  saveToDB: () => Promise<void>;
}

// 自定义存储适配器
const persistStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return localStorage.getItem(name);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      localStorage.setItem(name, value);
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      localStorage.removeItem(name);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
};

export const useChatStore = create<ChatStoreState>()(
  persist(
    (set, get) => ({
      sessions: {},
      currentSessionId: null,

      createSession: () => {
        const id = generateUUID();
        const newSession: ClientChat = {
          id,
          title: 'New Chat',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
        };

        set((state) => ({
          sessions: {
            ...state.sessions,
            [id]: newSession,
          },
          currentSessionId: id,
        }));

        // 异步保存到 IndexedDB
        get().saveToDB();
        return id;
      },

      getSession: (id: string) => {
        const { sessions } = get();
        return sessions[id] || null;
      },

      updateSession: (id: string, updates: Partial<Omit<ClientChat, 'id'>>) => {
        set((state) => {
          const session = state.sessions[id];
          if (!session) return state;

          const updatedSession = {
            ...session,
            ...updates,
            updatedAt: Date.now(),
          };

          return {
            sessions: {
              ...state.sessions,
              [id]: updatedSession,
            },
          };
        });

        get().saveToDB();
      },

      deleteSession: (id: string) => {
        set((state) => {
          const { [id]: deleted, ...restSessions } = state.sessions;
          return {
            sessions: restSessions,
            currentSessionId: state.currentSessionId === id ? null : state.currentSessionId,
          };
        });

        // 异步删除相关数据
        const deleteFromDB = async () => {
          try {
            await chatDB.chats.delete(id);
            await chatDB.streams.where('chatId').equals(id).delete();
          } catch (error) {
            console.error('Failed to delete from DB:', error);
          }
        };
        deleteFromDB();
      },

      setCurrentSession: (id: string | null) => {
        set({ currentSessionId: id });
      },

      addMessage: (sessionId: string, message: UIMessage) => {
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session) return state;

          const updatedSession = {
            ...session,
            messages: [...session.messages, message],
            updatedAt: Date.now(),
          };

          // 如果是第一条用户消息，自动生成标题
          if (session.messages.length === 0 && message.role === 'user' && session.title === 'New Chat') {
            updatedSession.title = get().generateTitle([message]);
          }

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: updatedSession,
            },
          };
        });

        get().saveToDB();
      },

      updateMessage: (sessionId: string, messageId: string, updates: Partial<UIMessage>) => {
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session) return state;

          const updatedMessages = session.messages.map(msg => 
            msg.id === messageId ? { ...msg, ...updates } : msg
          );

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                messages: updatedMessages,
                updatedAt: Date.now(),
              },
            },
          };
        });

        get().saveToDB();
      },

      deleteMessage: (sessionId: string, messageId: string) => {
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session) return state;

          const updatedMessages = session.messages.filter(msg => msg.id !== messageId);

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                messages: updatedMessages,
                updatedAt: Date.now(),
              },
            },
          };
        });

        get().saveToDB();
      },

      deleteMessagesAfterTimestamp: (sessionId: string, timestamp: number) => {
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session) return state;

          const updatedMessages = session.messages.filter(msg => {
            const messageTime = msg.createdAt ? new Date(msg.createdAt).getTime() : 0;
            return messageTime < timestamp;
          });

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                messages: updatedMessages,
                updatedAt: Date.now(),
              },
            },
          };
        });

        get().saveToDB();
      },

      getMessages: (sessionId: string) => {
        const { sessions } = get();
        return sessions[sessionId]?.messages || [];
      },

      createStreamId: async (streamId: string, chatId: string) => {
        try {
          await chatDB.streams.add({
            id: streamId,
            chatId,
            createdAt: Date.now(),
          });
        } catch (error) {
          console.error('Failed to create stream ID:', error);
          throw error;
        }
      },

      getStreamIdsByChatId: async (chatId: string) => {
        try {
          const streams = await chatDB.streams
            .where('chatId')
            .equals(chatId)
            .toArray();
          // 按创建时间排序
          const sortedStreams = streams.sort((a, b) => a.createdAt - b.createdAt);
          return sortedStreams.map((stream: StreamRecord) => stream.id);
        } catch (error) {
          console.error('Failed to get stream IDs:', error);
          return [];
        }
      },

      getSortedSessions: () => {
        const { sessions } = get();
        return Object.values(sessions).sort((a, b) => b.updatedAt - a.updatedAt);
      },

      generateTitle: (messages: UIMessage[]) => {
        const userMessage = messages.find((msg) => msg.role === 'user');
        if (!userMessage) return 'New Chat';
        
        let content = '';
        if (typeof userMessage.content === 'string') {
          content = userMessage.content;
        } else {
          // 对于非字符串内容，尝试提取文本
          try {
            const contentArray = userMessage.content as any;
            if (Array.isArray(contentArray)) {
              content = contentArray
                .filter((part: any) => part?.type === 'text')
                .map((part: any) => part?.text || '')
                .join(' ');
            }
          } catch {
            content = 'New Chat';
          }
        }
        
        // 截取前50个字符作为标题
        return content.length > 50 ? `${content.slice(0, 50)}...` : content || 'New Chat';
      },

      clearAllSessions: () => {
        set({
          sessions: {},
          currentSessionId: null,
        });

        // 清理 IndexedDB
        const clearDB = async () => {
          try {
            await chatDB.chats.clear();
            await chatDB.streams.clear();
          } catch (error) {
            console.error('Failed to clear DB:', error);
          }
        };
        clearDB();
      },

      loadFromDB: async () => {
        try {
          const chats = await chatDB.chats.orderBy('updatedAt').reverse().toArray();
          const sessionsMap: Record<string, ClientChat> = {};
          
          chats.forEach(chat => {
            sessionsMap[chat.id] = chat;
          });

          set((state) => ({
            sessions: { ...state.sessions, ...sessionsMap }
          }));
        } catch (error) {
          console.error('Failed to load from DB:', error);
        }
      },

      saveToDB: async () => {
        try {
          const { sessions } = get();
          const chatsToSave = Object.values(sessions);
          
          // 使用 bulkPut 来高效更新数据
          await chatDB.chats.bulkPut(chatsToSave);
        } catch (error) {
          console.error('Failed to save to DB:', error);
        }
      },
    }),
    {
      name: 'chat-sessions-storage',
      storage: createJSONStorage(() => persistStorage),
      partialize: (state) => ({
        sessions: state.sessions,
        currentSessionId: state.currentSessionId,
      }),
      onRehydrateStorage: () => (state) => {
        // 组件挂载后从 IndexedDB 加载数据
        if (state) {
          state.loadFromDB();
        }
      },
    }
  )
); 