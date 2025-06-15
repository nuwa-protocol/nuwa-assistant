'use client';

import { useLocale } from '@/locales/use-locale';
import { useState, memo } from 'react';
import { useChatStore } from '@/lib/stores/chat-store';
import { generateUUID } from '@/lib/utils';

import { SidebarToggle } from '@/components/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { AssistantNav } from '@/components/assistant-nav';
import { ChatHistorySearchModal } from '@/components/chat-history-search-modal';

function PureChatHeader({
  isReadonly: _isReadonly,
}: {
  isReadonly: boolean;
}) {
  const { t } = useLocale();
  const { setCurrentSessionId } = useChatStore();

  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
      <SidebarToggle />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="md:px-2 px-2 md:h-fit"
              onClick={() => {
                setCurrentSessionId(generateUUID());
              }}
            >
              {t('chat.new')}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('chat.new')}</TooltipContent>
        </Tooltip>
        <ChatHistorySearchModal open={searchOpen} onOpenChange={setSearchOpen} />
      <div className="flex-1" />
      <div className="flex items-center">
        <AssistantNav />
      </div>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader);
