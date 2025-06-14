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
  const { sessions, deleteSession, currentSessionId } = useChatStore();
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

  // get all sessions with messages and sort by time
  const now = Date.now();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayStart = startOfToday.getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  const sevenDaysAgo = now - 7 * oneDay;
  const thirtyDaysAgo = now - 30 * oneDay;

  const allSessionsWithMessages = Object.values(sessions)
    .filter(session => session.messages.length > 0)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  // group by time
  const grouped = {
    today: [] as typeof allSessionsWithMessages,
    last7: [] as typeof allSessionsWithMessages,
    last30: [] as typeof allSessionsWithMessages,
    older: [] as typeof allSessionsWithMessages,
  };

  allSessionsWithMessages.forEach(session => {
    if (session.updatedAt >= todayStart) {
      grouped.today.push(session);
    } else if (session.updatedAt >= sevenDaysAgo) {
      grouped.last7.push(session);
    } else if (session.updatedAt >= thirtyDaysAgo) {
      grouped.last30.push(session);
    } else {
      grouped.older.push(session);
    }
  });

  // check if all groups are empty
  const isAllEmpty =
    grouped.today.length === 0 &&
    grouped.last7.length === 0 &&
    grouped.last30.length === 0 &&
    grouped.older.length === 0;

  if (isAllEmpty) {
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
    if (id === currentSessionId) {
      router.push('/');
    }
  };

  // group render function
  const renderGroup = (title: string, items: typeof allSessionsWithMessages) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-2">
        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
          {title}
        </div>
        {items.map(session => (
          <ChatItem
            key={session.id}
            chat={session}
            isActive={session.id === currentSessionId}
            onDelete={handleDelete}
            setOpenMobile={setOpenMobile}
          />
        ))}
      </div>
    );
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {renderGroup('Today', grouped.today)}
          {renderGroup('This Week', grouped.last7)}
          {renderGroup('A Week Ago', grouped.last30)}
          {renderGroup('Older', grouped.older)}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
