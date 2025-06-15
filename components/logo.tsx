'use client';

import { useLocale } from "@/locales/use-locale";

export function Logo() {
  const { t } = useLocale();
  return (
    <div className="flex flex-row gap-3 items-center text-lg font-semibold px-2 rounded-md">
      {t('chat.logo')}
    </div>
  );
}