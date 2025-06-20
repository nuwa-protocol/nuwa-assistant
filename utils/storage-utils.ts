import { useDIDStore } from '@/stores/did-store';
import { useChatStore } from '@/stores/chat-store';
import { useSettingsStore } from '@/stores/settings-store';
import { useFileStore } from '@/stores/file-store';
import { useDocumentStore } from '@/stores/document-store';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// clear all client storage data, including:
export async function clearAllStorage() {
  if (!isBrowser) {
    return;
  }

  // reset all Zustand stores
  useDIDStore.getState().logout();
  useChatStore.persist.clearStorage();
  useSettingsStore.persist.clearStorage();
  useFileStore.persist.clearStorage();
  useDocumentStore.persist.clearStorage();

  // clear localStorage
  localStorage.clear();

  // clear IndexedDB
  const databases = await window.indexedDB.databases();
  for (const { name } of databases) {
    if (name) {
      window.indexedDB.deleteDatabase(name);
    }
  }

  // clear sessionStorage
  sessionStorage.clear();
}

// reset all stores for logging out
export const resetAllStores = () => {
  useChatStore.setState(useChatStore.getInitialState());
  useSettingsStore.setState(useSettingsStore.getInitialState());
  useFileStore.setState(useFileStore.getInitialState());
  useDocumentStore.setState(useDocumentStore.getInitialState());
  useDIDStore.getState().logout();
};

export const initalizeAllStores = () => {
  useChatStore.persist.rehydrate();
  useSettingsStore.persist.rehydrate();
  useFileStore.persist.rehydrate();
  useDocumentStore.persist.rehydrate();
  useDIDStore.persist.rehydrate();
};
