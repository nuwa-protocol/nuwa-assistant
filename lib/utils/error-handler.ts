import type { UIMessage } from 'ai';
import { generateUUID } from '@/lib/utils';

// 错误级别
export type ErrorLevel = 'info' | 'warning' | 'error' | 'critical';

// 错误处理接口
interface ErrorHandlerOptions {
  level?: ErrorLevel;
  showToUser?: boolean;
  logToConsole?: boolean;
}

// 创建错误消息
export function createErrorMessage(
  error: string | Error,
  options: ErrorHandlerOptions = {}
): UIMessage {
  const {
    level = 'error',
    showToUser = true,
    logToConsole = true
  } = options;

  const errorText = error instanceof Error ? error.message : error;
  
  if (logToConsole) {
    console.error(`[${level.toUpperCase()}]`, errorText);
  }

  if (!showToUser) {
    return createSystemMessage('An error occurred. Please try again.');
  }

  return createSystemMessage(formatErrorForUser(errorText, level));
}

// 格式化错误信息给用户
function formatErrorForUser(errorText: string, level: ErrorLevel): string {
  const emoji = getErrorEmoji(level);
  const prefix = getErrorPrefix(level);
  
  return `${emoji} **${prefix}**: ${errorText}

*If this issue persists, please check your internet connection or try refreshing the page.*`;
}

// 获取错误表情符号
function getErrorEmoji(level: ErrorLevel): string {
  switch (level) {
    case 'info':
      return 'ℹ️';
    case 'warning':
      return '⚠️';
    case 'error':
      return '❌';
    case 'critical':
      return '🚨';
    default:
      return '❌';
  }
}

// 获取错误前缀
function getErrorPrefix(level: ErrorLevel): string {
  switch (level) {
    case 'info':
      return 'Information';
    case 'warning':
      return 'Warning';
    case 'error':
      return 'Error';
    case 'critical':
      return 'Critical Error';
    default:
      return 'Error';
  }
}

// 创建系统消息
function createSystemMessage(content: string): UIMessage {
  return {
    id: generateUUID(),
    role: 'assistant',
    content,
    parts: [{ type: 'text', text: content }],
    createdAt: new Date(),
  };
}

// 常见错误类型处理
export const ErrorHandlers = {
  network: (error?: string) => createErrorMessage(
    error || 'Network connection failed. Please check your internet connection.',
    { level: 'error' }
  ),
  
  api: (error?: string) => createErrorMessage(
    error || 'Service temporarily unavailable. Please try again later.',
    { level: 'error' }
  ),
  
  storage: (error?: string) => createErrorMessage(
    error || 'Unable to save data locally. Please check your browser storage settings.',
    { level: 'warning' }
  ),
  
  validation: (error?: string) => createErrorMessage(
    error || 'Invalid input provided. Please check your data and try again.',
    { level: 'warning' }
  ),
  
  permission: (error?: string) => createErrorMessage(
    error || 'Permission denied. Please check your access rights.',
    { level: 'error' }
  ),
  
  notFound: (resource = 'resource') => createErrorMessage(
    `The requested ${resource} was not found.`,
    { level: 'warning' }
  ),
  
  timeout: (operation = 'operation') => createErrorMessage(
    `The ${operation} timed out. Please try again.`,
    { level: 'warning' }
  ),
  
  generic: (error?: string) => createErrorMessage(
    error || 'An unexpected error occurred. Please try again.',
    { level: 'error' }
  ),
};

// 错误边界处理函数
export function handleAsyncError<T>(
  promise: Promise<T>,
  fallback?: () => T
): Promise<T | null> {
  return promise.catch((error) => {
    console.error('Async operation failed:', error);
    return fallback ? fallback() : null;
  });
}

// 重试机制
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      console.warn(`Operation failed (attempt ${attempt}/${maxRetries}):`, error);
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw new Error('Max retries exceeded');
} 