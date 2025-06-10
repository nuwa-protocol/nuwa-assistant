'use client';

import { useMemo } from 'react';
import useSWR from 'swr';
import type { VisibilityType } from '@/components/visibility-selector';

export function useChatVisibility({
  chatId,
  initialVisibilityType,
}: {
  chatId: string;
  initialVisibilityType: VisibilityType;
}) {
  const { data: localVisibility, mutate: setLocalVisibility } = useSWR(
    `${chatId}-visibility`,
    null,
    {
      fallbackData: initialVisibilityType,
    },
  );

  // 在纯客户端模式下，直接使用本地状态
  const visibilityType = useMemo(() => {
    return localVisibility || initialVisibilityType;
  }, [localVisibility, initialVisibilityType]);

  const setVisibilityType = (updatedVisibilityType: VisibilityType) => {
    setLocalVisibility(updatedVisibilityType);
    // TODO: 实现客户端聊天可见性存储
    // 在客户端化完成后，这里可以保存到 localStorage/IndexedDB
  };

  return { visibilityType, setVisibilityType };
}
