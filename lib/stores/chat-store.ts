// chat-store.ts
// Store for managing chat sessions and message history with IndexedDB persistence
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Message } from 'ai';
import { generateTitleFromUserMessage } from '@/lib/utils';
// eslint-disable-next-line import/no-named-as-default
import Dexie, { type Table } from 'dexie';
import { useDIDStore } from './did-store';

// ================= Interfaces ================= //

// client chat interface
export interface ChatSession {
  id: string;
  did: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
}

// stream ID management interface
export interface StreamRecord {
  id: string;
  did: string;
  chatId: string;
  createdAt: number;
}

// ================= Database Definition ================= //

class ChatDatabase extends Dexie {
  chats!: Table<ChatSession>;
  streams!: Table<StreamRecord>;

  constructor() {
    if (typeof window === 'undefined') {
      // return a dummy Dexie instance on server side
      super('dummy');
      return;
    }
    super('ChatDatabase');
    this.version(1).stores({
      chats: 'id, did, createdAt, updatedAt',
      streams: 'id, did, chatId, createdAt',
    });
  }
}

const chatDB = new ChatDatabase();

// chat store state interface
interface ChatStoreState {
  sessions: Record<string, ChatSession>;
  currentSessionId: string | null;

  // session management
  getSession: (id: string) => ChatSession | null;
  getCurrentSession: () => ChatSession | null;
  updateSession: (
    id: string,
    updates: Partial<Omit<ChatSession, 'id'>>,
  ) => void;
  deleteSession: (id: string) => void;
  setCurrentSessionId: (id: string | null) => void;

  // message management
  updateMessages: (sessionId: string, messages: Message[]) => void;
  updateSingleMessage: (
    sessionId: string,
    messageId: string,
    updates: Partial<Message>,
  ) => void;
  deleteMessage: (sessionId: string, messageId: string) => void;
  deleteMessagesAfterTimestamp: (sessionId: string, timestamp: number) => void;
  getMessages: (sessionId: string) => Message[];

  // stream management
  createStreamId: (streamId: string, chatId: string) => Promise<void>;
  getStreamIdsByChatId: (chatId: string) => Promise<string[]>;

  // tool methods
  updateTitle: (chatId: string) => Promise<void>;
  clearAllSessions: () => void;

  // data persistence
  loadFromDB: () => Promise<void>;
  saveToDB: () => Promise<void>;
}

// ================= Environment & Storage ================= //

const isBrowser = typeof window !== 'undefined';

const persistStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (!isBrowser) return null;
    try {
      const currentDID = useDIDStore.getState().did;
      const actualKey = currentDID
        ? `chat-storage-${currentDID}`
        : 'chat-storage';
      return localStorage.getItem(actualKey);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (!isBrowser) return;
    try {
      const currentDID = useDIDStore.getState().did;
      const actualKey = currentDID
        ? `chat-storage-${currentDID}`
        : 'chat-storage';
      localStorage.setItem(actualKey, value);
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    if (!isBrowser) return;
    try {
      const currentDID = useDIDStore.getState().did;
      const actualKey = currentDID
        ? `chat-storage-${currentDID}`
        : 'chat-storage';
      localStorage.removeItem(actualKey);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
};

// ================= Store Factory ================= //

export const useChatStore = create<ChatStoreState>()(
  persist(
    (set, get) => ({
      sessions: {},
      currentSessionId: null,

      getSession: (id: string) => {
        const { sessions } = get();
        return sessions[id] || null;
      },

      getCurrentSession: () => {
        const { sessions, currentSessionId } = get();
        return currentSessionId ? sessions[currentSessionId] || null : null;
      },

      updateSession: (
        id: string,
        updates: Partial<Omit<ChatSession, 'id'>>,
      ) => {
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
            currentSessionId:
              state.currentSessionId === id ? null : state.currentSessionId,
          };
        });

        // async delete related data
        const deleteFromDB = async () => {
          try {
            const currentDID = useDIDStore.getState().did;
            if (!currentDID) return;

            await chatDB.chats
              .where(['did', 'id'])
              .equals([currentDID, id])
              .delete();
            await chatDB.streams
              .where(['did', 'chatId'])
              .equals([currentDID, id])
              .delete();
          } catch (error) {
            console.error('Failed to delete from DB:', error);
          }
        };
        deleteFromDB();
      },

      setCurrentSessionId: (id: string | null) => {
        set({ currentSessionId: id });
      },

      updateMessages: (sessionId: string, messages: Message[]) => {
        set((state) => {
          let session = state.sessions[sessionId];
          let isNewSession = false;

          // if session not found, create new session
          if (!session) {
            isNewSession = true;
            const currentDID = useDIDStore.getState().did || '';
            session = {
              id: sessionId,
              did: currentDID,
              title: 'New Chat',
              createdAt: Date.now(),
              updatedAt: Date.now(),
              messages: [],
            };
            console.log('create new session');
          }

          // check if there are new messages to add
          const currentMessageIds = new Set(
            session.messages.map((msg) => msg.id),
          );
          const hasNewMessages = messages.some(
            (msg) => !currentMessageIds.has(msg.id),
          );

          // only update when there are new messages
          if (hasNewMessages || isNewSession) {
            const updatedSession = {
              ...session,
              messages: [...messages], // completely replace message list
              updatedAt: Date.now(),
            };

            const newState = {
              sessions: {
                ...state.sessions,
                [sessionId]: updatedSession,
              },
              // if new session, set as current session
              currentSessionId: state.currentSessionId || sessionId,
            };

            // async generate title (if new session and has user message)
            if (isNewSession && messages.length > 0) {
              setTimeout(() => {
                get().updateTitle(sessionId);
              }, 0);
            }

            return newState;
          }

          return state;
        });

        get().saveToDB();
      },

      updateSingleMessage: (
        sessionId: string,
        messageId: string,
        updates: Partial<Message>,
      ) => {
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session) return state;

          const updatedMessages = session.messages.map((msg) =>
            msg.id === messageId ? { ...msg, ...updates } : msg,
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

          const updatedMessages = session.messages.filter(
            (msg) => msg.id !== messageId,
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

      deleteMessagesAfterTimestamp: (sessionId: string, timestamp: number) => {
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session) return state;

          const updatedMessages = session.messages.filter((msg) => {
            const messageTime = msg.createdAt
              ? new Date(msg.createdAt).getTime()
              : 0;
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
          const currentDID = useDIDStore.getState().did || '';
          await chatDB.streams.add({
            id: streamId,
            did: currentDID,
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
          const currentDID = useDIDStore.getState().did;
          if (!currentDID) return [];

          const streams = await chatDB.streams
            .where(['did', 'chatId'])
            .equals([currentDID, chatId])
            .toArray();
          // sort by creation time
          const sortedStreams = streams.sort(
            (a, b) => a.createdAt - b.createdAt,
          );
          return sortedStreams.map((stream) => stream.id);
        } catch (error) {
          console.error('Failed to get stream IDs:', error);
          return [];
        }
      },

      updateTitle: async (sessionId: string) => {
        const session = get().getSession(sessionId);
        if (!session || session.messages.length === 0) return;

        // find the first user message
        const firstUserMessage = session.messages.find(
          (msg) => msg.role === 'user',
        );
        if (!firstUserMessage) return;

        try {
          const title = await generateTitleFromUserMessage({
            message: firstUserMessage,
          });

          // directly update session title
          get().updateSession(sessionId, { title });
        } catch (error) {
          console.error('Failed to generate title with AI:', error);
        }
      },

      clearAllSessions: () => {
        set({
          sessions: {},
          currentSessionId: null,
        });

        // clear IndexedDB
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
        if (typeof window === 'undefined') return;

        try {
          const currentDID = useDIDStore.getState().did;
          if (!currentDID) return;

          const chats = await chatDB.chats
            .where('did')
            .equals(currentDID)
            .toArray();

          // Sort by updatedAt in descending order
          const sortedChats = chats.sort((a, b) => b.updatedAt - a.updatedAt);
          const sessionsMap: Record<string, ChatSession> = {};

          sortedChats.forEach((chat) => {
            sessionsMap[chat.id] = chat;
          });

          set((state) => ({
            sessions: { ...state.sessions, ...sessionsMap },
          }));
        } catch (error) {
          console.error('Failed to load from DB:', error);
        }
      },

      saveToDB: async () => {
        if (typeof window === 'undefined') return;

        try {
          const { sessions } = get();
          const chatsToSave = Object.values(sessions);

          // use bulkPut to efficiently update data
          await chatDB.chats.bulkPut(chatsToSave);
        } catch (error) {
          console.error('Failed to save to DB:', error);
        }
      },
    }),
    {
      name: `chat-storage-${useDIDStore.getState().did}`,
      storage: createJSONStorage(() => persistStorage),
      partialize: (state) => ({
        sessions: state.sessions,
        currentSessionId: state.currentSessionId,
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
