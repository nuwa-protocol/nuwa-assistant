'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useDIDStore } from '@/lib/stores/did-store';
import { clearAllStorage } from '@/lib/stores/storage-utils';
import { useLocale } from '@/locales/use-locale';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function AssistantNav() {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const { did, logout } = useDIDStore();
  const { t } = useLocale();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!did) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          data-testid="assistant-nav-button"
          className="flex items-center rounded-full bg-background p-2 hover:shadow hover:bg-accent hover:text-accent-foreground focus:outline-none hover:cursor-pointer"
        >
          <Image
            src={`https://avatar.vercel.sh/${did}`}
            alt={'Assistant Avatar'}
            width={36}
            height={36}
            className="rounded-full"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        data-testid="assistant-nav-menu"
        side="bottom"
        align="end"
        className="min-w-[180px]"
      >
        <DropdownMenuItem
          data-testid="assistant-nav-item-theme"
          className="cursor-pointer"
          onSelect={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        >
          {t('nav.toggleTheme', { mode: resolvedTheme === 'light' ? 'dark' : 'light' })}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild data-testid="assistant-nav-item-auth">
          <button
            type="button"
            className="w-full cursor-pointer text-left"
            onClick={handleLogout}
          >
            {t('nav.signOut')}
          </button>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          data-testid="assistant-nav-item-clear-store"
          className="cursor-pointer text-destructive"
          onSelect={async () => {
            await clearAllStorage();
            window.location.reload();
          }}
        >
          {t('nav.clearStorage')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 