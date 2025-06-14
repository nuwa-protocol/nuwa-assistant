import { useState, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useChatStore } from '@/lib/stores/chat-store';
import { useRouter } from 'next/navigation';
import { Input } from './ui/input';
import { useLocale } from '@/locales/use-locale';

export function ChatHistorySearchModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { sessions } = useChatStore();
  const [query, setQuery] = useState('');
  const router = useRouter();
  const { t } = useLocale();

  const sessionList = useMemo(() => Object.values(sessions).sort((a, b) => b.updatedAt - a.updatedAt), [sessions]);
  const filtered = useMemo(() => {
    if (!query.trim()) return sessionList;
    return sessionList.filter(s => s.title.toLowerCase().includes(query.toLowerCase()));
  }, [query, sessionList]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="max-w-xl w-full fixed left-1/2 top-1/2 z-50 grid translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg">
          <Dialog.Title className="text-lg font-semibold mb-2">{t('chat.searchHistory')}</Dialog.Title>
          <div className="mb-4">
            <Input
              autoFocus
              placeholder={t('chat.searchHistory')}
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="max-h-80 overflow-y-auto divide-y">
            {filtered.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">{t('chat.noChatsHistory')}</div>
            ) : (
              filtered.map(session => (
                <button
                  key={session.id}
                  className="w-full text-left px-3 py-2 hover:bg-muted rounded flex flex-col"
                  onClick={() => {
                    router.push(`/chat/${session.id}`);
                    onOpenChange(false);
                  }}
                >
                  <div className="font-medium truncate">{session.title}</div>
                  <div className="text-xs text-muted-foreground">{new Date(session.updatedAt).toLocaleString()}</div>
                </button>
              ))
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 