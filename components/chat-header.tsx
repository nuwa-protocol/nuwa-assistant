'use client';

import { memo } from 'react';

import { AssistantNav } from '@/components/assistant-nav';
import { Logo } from './logo';
import { useSettingsStore } from '@/lib/stores/settings-store';

function PureChatHeader({
  isReadonly: _isReadonly,
}: {
  isReadonly: boolean;
}) {
  const sidebarMode = useSettingsStore((state) => state.sidebarMode);
  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
      <Logo />
      <div className="flex-1" />
      <div className="flex items-center">
        <AssistantNav />
      </div>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader);
