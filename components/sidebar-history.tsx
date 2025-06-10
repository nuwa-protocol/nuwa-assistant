'use client';

import {
    SidebarGroup,
    SidebarGroupContent,
    useSidebar,
} from '@/components/ui/sidebar';
import { useDIDStore } from '@/lib/stores/did-store';

export function SidebarHistory() {
  const { setOpenMobile } = useSidebar();
  const { isAuthenticated } = useDIDStore();

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

  // TODO: 实现客户端聊天历史管理
  // 将从 localStorage/IndexedDB 读取聊天记录
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Chat history</p>
            <p className="text-xs text-muted-foreground mt-1">
              Coming soon - will be stored locally
            </p>
          </div>
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
