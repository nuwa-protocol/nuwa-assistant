'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useChatStore } from '@/lib/stores/chat-store';
import { ChatItem } from './sidebar-history-item';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from './ui/sheet';
import { SidebarMenu } from './ui/sidebar';

interface ChatHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatHistoryModal({ isOpen, onClose }: ChatHistoryModalProps) {
  const { sessions, deleteSession, currentSessionId } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // calculate items per page based on screen height
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const calculateItemsPerPage = () => {
      if (typeof window === 'undefined') return 10;
      
      const screenHeight = window.innerHeight;
      const itemHeight = 60; // estimated height of each chat item
      const reservedSpace = 300; // space for header, search bar, pagination, etc.
      const calculatedItems = Math.floor((screenHeight - reservedSpace) / itemHeight);
      
      return Math.max(5, Math.min(calculatedItems, 20)); // minimum 5, maximum 20
    };

    setItemsPerPage(calculateItemsPerPage());
    
    const handleResize = () => {
      setItemsPerPage(calculateItemsPerPage());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // get all sessions with messages and search
  const filteredSessions = useMemo(() => {
    const allSessions = Object.values(sessions)
      .filter(session => session.messages.length > 0)
      .sort((a, b) => b.updatedAt - a.updatedAt);

    if (!searchQuery.trim()) {
      return allSessions;
    }

    const query = searchQuery.toLowerCase();
    return allSessions.filter(session => {
      // search title
      if (session.title.toLowerCase().includes(query)) {
        return true;
      }
      // search message content
      return session.messages.some(message => 
        message.content.toLowerCase().includes(query)
      );
    });
  }, [sessions, searchQuery]);

  // pagination calculation
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSessions = filteredSessions.slice(startIndex, startIndex + itemsPerPage);

  // reset pagination when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleDelete = (id: string) => {
    deleteSession(id);
    // if the deleted session is the current session, additional handling may be needed
    if (id === currentSessionId) {
      // additional logic can be added here, such as redirecting
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[600px] sm:w-[800px] h-full flex flex-col">
        <SheetHeader>
          <SheetTitle>Chat History</SheetTitle>
        </SheetHeader>

        {/* search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => setSearchQuery('')}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* result statistics */}
        <div className="text-sm text-muted-foreground mb-4">
          {searchQuery ? (
            <>Showing {filteredSessions.length} of {Object.values(sessions).filter(s => s.messages.length > 0).length} conversations</>
          ) : (
            <>Total {filteredSessions.length} conversations</>
          )}
        </div>

            {/* session list */}
        <SidebarMenu className="flex-1 overflow-y-auto">
          {paginatedSessions.length > 0 ? (
            paginatedSessions.map((session) => (
                <ChatItem
                    key={session.id}
                    chat={session}
                    isActive={false}
                    onDelete={handleDelete}
                    setOpenMobile={onClose} // close modal after click
                />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </div>
          )}
        </SidebarMenu>

        {/* pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
} 