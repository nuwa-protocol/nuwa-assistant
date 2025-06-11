'use client';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  useSidebar
} from '@/components/ui/sidebar';
import { useDIDStore } from '@/lib/stores/did-store';
import { useChatStore } from '@/lib/stores/chat-store';
import { ChatItem } from './sidebar-history-item';
import { useRouter } from 'next/navigation';

export function SidebarHistory() {
  const { setOpenMobile } = useSidebar();
  const { isAuthenticated } = useDIDStore();
  const { getSortedSessions, deleteSession, currentSessionId } = useChatStore();
  const router = useRouter();

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

  const sessions = getSortedSessions();

  if (sessions.length === 0) {
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
    // 如果删除的是当前会话，跳转到首页
    if (id === currentSessionId) {
      router.push('/');
    }
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {sessions.map((session) => (
            <ChatItem
              key={session.id}
              chat={session}
              isActive={session.id === currentSessionId}
              onDelete={handleDelete}
              setOpenMobile={setOpenMobile}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
