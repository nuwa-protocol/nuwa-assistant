'use client';

import { useState } from 'react';
import { SidebarHistory } from '@/components/sidebar-history';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { generateUUID } from '@/lib/utils';
import { useChatStore } from '@/lib/stores/chat-store';
import { useLocale } from '@/locales/use-locale';
import { ChatHistorySearchModal } from '@/components/chat-history-search-modal';
import { Search } from 'lucide-react';

export function AppSidebar() {
  const { setOpenMobile } = useSidebar();
  const { setCurrentSessionId } = useChatStore();
  const { t } = useLocale();
  const [searchOpen, setSearchOpen] = useState(false);
  
  const handleNewChat = () => {
    setOpenMobile(false);
    setCurrentSessionId(generateUUID());
  };

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row justify-between items-center">
            <Link
              href="/"
              onClick={() => {
                setOpenMobile(false);
              }}
              className="flex flex-row gap-3 items-center"
            >
              <span className="text-lg font-semibold px-2 hover:bg-muted rounded-md cursor-pointer">
                {t('chat.chatbot')}
              </span>
            </Link>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  type="button"
                  className="p-2 h-fit"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent align="end">{t('chat.search')}</TooltipContent>
            </Tooltip>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarHistory />
      </SidebarContent>
      <SidebarFooter>
      </SidebarFooter>
      <ChatHistorySearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </Sidebar>
  );
}
