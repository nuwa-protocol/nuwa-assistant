'use client';

import { Chat } from '@/components/chat';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { AuthGuard } from '@/components/auth-guard';
import { generateUUID } from '@/lib/utils';

export default function Page(props: { params: Promise<{ id: string }> }) {
  // TODO: 实现客户端聊天历史管理
  // 当前简化版本：每个聊天页面都是新的会话
  // 后续可以从 localStorage/IndexedDB 读取历史消息
  
  const newChatId = generateUUID(); // 为了保证每次都是新的聊天会话

  return (
    <AuthGuard>
      <Chat
        id={newChatId}
        initialMessages={[]}
        initialChatModel={DEFAULT_CHAT_MODEL}
        initialVisibilityType="private"
        isReadonly={false}
        autoResume={false}
      />
      <DataStreamHandler id={newChatId} />
    </AuthGuard>
  );
}
