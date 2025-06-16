'use client';

import React, { useState, useRef } from 'react';
import { Camera, Shield, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as Dialog from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { useDIDStore } from '@/lib/stores/did-store';
import { useLocale } from '@/locales/use-locale';
import { SettingSection } from './setting-section';
import { CopyIcon } from './icons';
import { useCopyToClipboard } from 'usehooks-ts';
import { toast } from '@/components/toast';
import type { SettingCardProps } from './setting-card';
import { SettingsNav } from './settings-nav';
import Image from 'next/image';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

// Define the type for settingsSections
interface SettingsSection {
  id: string;
  icon: LucideIcon;
  name: string;
  description: string;
  cardItems: SettingCardProps[];
}

export function SettingsModal({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();
  const [activeSectionIndex, setActiveSectionIndex] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { name, avatar, setName, setAvatar } = useSettingsStore();
  const { did } = useDIDStore();
  const [tempName, setTempName] = useState(name);

  const [_, copyToClipboard] = useCopyToClipboard();

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          setAvatar(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatar(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const didInformationContent = () => {
    return (
      <div>
        {did && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="cursor-pointer select-none flex items-center"
                role="button"
                onClick={async () => {
                  await copyToClipboard(did);
                  toast({
                    type: 'success',
                    description: t('settings.profile.didInformation.copied'),
                  });
                }}
              >
                <CopyIcon size={14} />
                <span className="ml-1 font-mono text-sm">{did}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {t('settings.profile.didInformation.copy') || 'Click to copy'}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    );
  };

  const photoContent = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            {avatar ? (
              <AvatarImage src={avatar} alt="Profile" />
            ) : (
              <AvatarFallback asChild>
                <Image
                  src={`https://avatar.vercel.sh/${did}`}
                  alt="Avatar"
                  width={80}
                  height={80}
                />
              </AvatarFallback>
            )}
          </Avatar>
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-4 w-4 mr-2" />
                {t('settings.profile.photo.changePhoto')}
              </Button>
              {avatar && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveAvatar}
                >
                  {t('settings.profile.photo.remove')}
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('settings.profile.photo.fileTypes')}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const displayNameContent = () => {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            id="name"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            placeholder={t('settings.profile.displayName.placeholder')}
            className="max-w-md"
          />
          <Button
            onClick={() => setName(tempName)}
            disabled={tempName === name}
            size="sm"
          >
            {t('settings.profile.displayName.save')}
          </Button>
        </div>
      </div>
    );
  };

  const comingSoonContent = () => {
    return (
      <p className="text-sm text-muted-foreground">
        {t('settings.comingSoon.details')}
      </p>
    );
  };

  const settingsSections: SettingsSection[] = [
    {
      id: 'profile',
      icon: User,
      name: t('settings.sections.profile.title'),
      description: t('settings.sections.profile.subtitle'),
      cardItems: [
        {
          title: t('settings.profile.displayName.title'),
          description: t('settings.profile.displayName.description'),
          content: displayNameContent(),
        },
        {
          title: t('settings.profile.photo.title'),
          description: t('settings.profile.photo.description'),
          content: photoContent(),
        },
        {
          title: t('settings.profile.didInformation.title'),
          description: t('settings.profile.didInformation.description'),
          content: didInformationContent(),
        },
      ],
    },
    {
      id: 'security',
      icon: Shield,
      name: t('settings.sections.security.title'),
      description: t('settings.sections.security.subtitle'),
      cardItems: [
        {
          title: t('settings.comingSoon.title'),
          description: t('settings.comingSoon.security.description'),
          content: comingSoonContent(),
        },
      ],
    },
  ];

  const activeSection = settingsSections[activeSectionIndex];

  return (
    <Dialog.Dialog>
      <Dialog.DialogTrigger asChild>{children}</Dialog.DialogTrigger>
      <Dialog.DialogContent
        className="fixed left-1/2 top-1/2 z-50 grid -translate-x-1/2 -translate-y-1/2 gap-0 border bg-background p-0 shadow-lg sm:rounded-lg overflow-hidden"
        style={{
          width: '80vw',
          maxWidth: 800,
          height: '80vh',
          maxHeight: 700,
        }}
        aria-describedby={undefined}
      >
        <Dialog.DialogTitle className="sr-only">Settings</Dialog.DialogTitle>
        <div className="w-full h-full overflow-auto hide-scrollbar">
          <div className="mx-auto w-full px-16 pb-8">
            <SettingsNav
              settingsSections={settingsSections}
              setActiveSectionIndex={setActiveSectionIndex}
              activeSectionIndex={activeSectionIndex}
            />
            <SettingSection
              key={activeSection.id}
              title={activeSection.name}
              description={activeSection.description}
              settingCards={activeSection.cardItems}
            />
          </div>
        </div>
      </Dialog.DialogContent>
    </Dialog.Dialog>
  );
}
