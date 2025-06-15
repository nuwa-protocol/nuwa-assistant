'use client';

import Link from "next/link";
import { useLocale } from "@/locales/use-locale";
import { useSidebar } from "@/components/ui/sidebar";

export function Logo() {
  const { setOpenMobile } = useSidebar();
  const { t } = useLocale();
  return (
    <Link
    href="/"
    onClick={() => {
        setOpenMobile(false);
    }}
    className="flex flex-row gap-3 items-center"
    >
        <span className="text-lg font-semibold px-2 hover:bg-muted rounded-md cursor-pointer">
            {t('chat.logo')}
        </span>
    </Link>
  );
}