'use client';

import { useState } from 'react';
import { SidebarHistory } from '@/components/sidebar-history';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import { generateUUID } from '@/lib/utils';
import { useChatStore } from '@/lib/stores/chat-store';
import { useLocale } from '@/locales/use-locale';
import { SidebarButton } from './ui/sidebar-button';
import { Search } from 'lucide-react';
import { ChatHistorySearchModal } from './chat-history-search-modal';
import { SidebarToggle } from './sidebar-toggle';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { useFloatingSidebar } from '@/components/floating-sidebar';
import { cn } from '@/lib/utils';
import { Logo } from './logo';

export function AppSidebar() {
  const { setOpenMobile } = useSidebar();
  const { setCurrentSessionId } = useChatStore();
  const { t } = useLocale();
  const [searchOpen, setSearchOpen] = useState(false);
  const sidebarMode = useSettingsStore(state => state.sidebarMode);
  
  // Use floating sidebar context if available (only in floating mode)
  let floatingContext = null;
  try {
    floatingContext = useFloatingSidebar();
  } catch {
    // Context not available, which is fine for non-floating modes
  }
  
  const handleNewChat = () => {
    setOpenMobile(false);
    setCurrentSessionId(generateUUID());
  };

  const sidebarVariant = sidebarMode === 'floating' ? 'floating' : 'sidebar';

  const handleMouseEnter = () => {
    if (sidebarMode === 'floating' && floatingContext) {
      floatingContext.setIsHovering(true);
    }
  };

  const handleMouseLeave = () => {
    if (sidebarMode === 'floating' && floatingContext) {
      floatingContext.setIsHovering(false);
    }
  };

  return (
    <>
    <Sidebar 
      className={cn(
        "group-data-[side=left]:border-r-0",
        // Add smooth transition animations
        "transition-all duration-300 ease-in-out",
      )}
      variant={sidebarVariant}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <Logo />
              <SidebarToggle />
            </div>
            <SidebarButton
              text={t('chat.new', { defaultValue: 'New Chat' })}
              onClick={handleNewChat}
              variant="primary"
              className="my-2"
            />
            <SidebarButton
              icon={Search}
              text={t('chat.search', { defaultValue: 'Search' })}
              onClick={() => setSearchOpen(true)}
              variant="secondary"
            />
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="mt-2">
        <SidebarHistory />
      </SidebarContent>
      <SidebarFooter>
      </SidebarFooter>
    </Sidebar>
    <ChatHistorySearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
