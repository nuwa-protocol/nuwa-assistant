import { useState, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useChatStore } from '@/lib/stores/chat-store';
import { Input } from './ui/input';
import { useLocale } from '@/locales/use-locale';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

export function ChatHistorySearchModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { sessions,setCurrentSessionId } = useChatStore();
  const [query, setQuery] = useState('');
  const { t } = useLocale();

  const sessionList = useMemo(() => Object.values(sessions).sort((a, b) => b.updatedAt - a.updatedAt), [sessions]);
  const filtered = useMemo(() => {
    if (!query.trim()) return sessionList;
    return sessionList.filter(s => s.title.toLowerCase().includes(query.toLowerCase()));
  }, [query, sessionList]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div
            className="fixed inset-0 z-50 bg-black/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        </Dialog.Overlay>
        <Dialog.Content className="max-w-xl w-full fixed left-1/2 top-1/2 z-50 grid -translate-x-1/2 -translate-y-1/2 gap-0 border bg-background p-6 shadow-lg sm:rounded-lg" aria-describedby={undefined}>
          <motion.div
            initial={{ opacity: 0}}
            animate={{ opacity: 1}}
            exit={{ opacity: 0}}
          >
            <Dialog.Title className="text-lg font-semibold mb-2 hidden">{t('chat.searchHistory')}</Dialog.Title>
            <Input
              autoFocus
              placeholder={t('chat.searchHistory')}
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full rounded-none border-0 border-b focus-visible:ring-0 focus-visible:border-primary"
              style={{ marginBottom: 0 }}
            />
            <div className="max-h-80 overflow-y-auto divide-y mt-4">
              {filtered.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">{t('chat.noChatsHistory')}</div>
              ) : (
                filtered.map(session => (
                  <button
                    key={session.id}
                    className="w-full px-1 py-2 hover:bg-muted rounded flex items-center justify-between"
                    onClick={() => {
                      setCurrentSessionId(session.id);
                      onOpenChange(false);
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MessageSquare size={20} className="text-muted-foreground flex-shrink-0" />
                      <span className="font-medium truncate">{session.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                      {formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })}
                    </span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 