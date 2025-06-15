import { useDIDStore } from './did-store';
import { useChatStore } from './chat-store';
import { useSettingsStore } from './settings-store';
import { useFileStore } from './file-store';
import { useDocumentStore } from './document-store';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * clear all client storage data, including:
 * - LocalStorage
 * - IndexedDB
 * - SessionStorage
 * - Zustand Stores
 */
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