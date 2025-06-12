'use client';

import { useState } from 'react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  useSidebar
} from '@/components/ui/sidebar';
import { useDIDStore } from '@/lib/stores/did-store';
import { useChatStore } from '@/lib/stores/chat-store';
import { ChatItem } from './sidebar-history-item';
import { ChatHistoryModal } from './chat-history-modal';
import { useRouter } from 'next/navigation';

export function SidebarHistory() {
  const { setOpenMobile } = useSidebar();
  const { isAuthenticated } = useDIDStore();
  const { sessions, deleteSession, currentSessionId } = useChatStore();
  const router = useRouter();
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  if (!isAuthenticated) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            Login with your DID to save chat history!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  // filter out sessions with messages in the last 24 hours
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  
  const recentSessions = Object.values(sessions)
    .filter(session => 
      session.messages.length > 0 && // only show sessions with messages
      session.updatedAt > oneDayAgo   // updated in the last 24 hours
    )
    .sort((a, b) => b.updatedAt - a.updatedAt);

  // check if there are more history records
  const allSessionsWithMessages = Object.values(sessions)
    .filter(session => session.messages.length > 0)
    .sort((a, b) => b.updatedAt - a.updatedAt);
  
  const hasMoreHistory = allSessionsWithMessages.length > recentSessions.length;

  if (recentSessions.length === 0) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">No chats yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Start a conversation to see it here
              </p>
            </div>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  const handleDelete = (id: string) => {
    deleteSession(id);
    // if the deleted session is the current session, redirect to home page
    if (id === currentSessionId) {
      router.push('/');
    }
  };

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {recentSessions.map((session) => (
              <ChatItem
                key={session.id}
                chat={session}
                isActive={session.id === currentSessionId}
                onDelete={handleDelete}
                setOpenMobile={setOpenMobile}
              />
            ))}
            {hasMoreHistory && (
              <div className="px-2 py-2">
                <button 
                  className="w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsHistoryModalOpen(true)}
                >
                  View more history...
                </button>
              </div>
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <ChatHistoryModal 
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />
    </>
  );
}
