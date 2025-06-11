'use client';

import { ChevronUp } from 'lucide-react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useDIDStore } from '@/lib/stores/did-store';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export function UserNav() {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const { did, logout } = useDIDStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!did) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              data-testid="user-nav-button"
              className="data-[state=open]:bg-sidebar-accent bg-background data-[state=open]:text-sidebar-accent-foreground h-10"
            >
              <Image
                src={`https://avatar.vercel.sh/${did}`}
                alt={did ?? 'User Avatar'}
                width={24}
                height={24}
                className="rounded-full"
              />
              <span data-testid="user-did" className="truncate">
                {did}
              </span>
              <ChevronUp className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            data-testid="user-nav-menu"
            side="top"
            className="w-[--radix-popper-anchor-width]"
          >
            <DropdownMenuItem
              data-testid="user-nav-item-theme"
              className="cursor-pointer"
              onSelect={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            >
              {`Toggle ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild data-testid="user-nav-item-auth">
              <button
                type="button"
                className="w-full cursor-pointer"
                onClick={handleLogout}
              >
                Sign out
              </button>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              data-testid="user-nav-item-clear-store"
              className="cursor-pointer text-destructive"
              onSelect={() => {
                localStorage.removeItem('user-did-storage');
                window.location.reload();
              }}
            >
              清理所有存储（测试用）
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
} 