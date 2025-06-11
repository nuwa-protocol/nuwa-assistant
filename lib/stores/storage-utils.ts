import { useDIDStore } from './did-store';
import { useChatStore } from './chat-store';
import { useSettingsStore } from './settings-store';
import { useFileStore } from './file-store';
import { useDocumentStore } from './document-store';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * 清除所有客户端存储的数据，包括：
 * - LocalStorage
 * - IndexedDB
 * - SessionStorage
 * - Cookies
 * - Zustand Stores
 */
export async function clearAllStorage() {
  if (!isBrowser) {
    return;
  }

  // 重置所有 Zustand stores
  useDIDStore.getState().logout();
  useChatStore.persist.clearStorage();
  useSettingsStore.persist.clearStorage();
  useFileStore.persist.clearStorage();
  useDocumentStore.persist.clearStorage();
  
  // 清除 localStorage
  localStorage.clear();
  
  // 清除 IndexedDB
  const databases = await window.indexedDB.databases();
  for (const { name } of databases) {
    if (name) {
      window.indexedDB.deleteDatabase(name);
    }
  }
  
  // 清除 sessionStorage
  sessionStorage.clear();
  
  // 清除 cookies
  document.cookie.split(";").forEach((c) => {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
} 