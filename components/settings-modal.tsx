'use client';

import React, { useState, useRef } from 'react';
import { Camera, Monitor, Shield, User, AlertTriangle } from 'lucide-react';
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
import { clearAllStorage } from '@/lib/stores/storage-utils';

// Define the type for settingsSections
interface SettingsSection {
  id: string;
  icon: LucideIcon;
  name: string;
  description: string;
  cardItems: SettingCardProps[];
}

// Update props to support controlled and uncontrolled usage
interface SettingsModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export function SettingsModal({
  open,
  onOpenChange,
  children,
}: SettingsModalProps) {
  const { t } = useLocale();
  const [activeSectionIndex, setActiveSectionIndex] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const { settings, setSetting } = useSettingsStore();
  const { did } = useDIDStore();
  const [tempName, setTempName] = useState(settings.name);

  const [_, copyToClipboard] = useCopyToClipboard();

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          setSetting('avatar', result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setSetting('avatar', null);
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
            {settings.avatar ? (
              <AvatarImage src={settings.avatar} alt="Profile" />
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
              {settings.avatar && (
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
            onClick={() => setSetting('name', tempName)}
            disabled={tempName === settings.name}
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

  const clearAllStorageContent = () => {
    const handleClearStorage = async () => {
      setIsClearing(true);
      try {
        await clearAllStorage();
        toast({
          type: 'success',
          description: t('settings.system.clearAllStorage.success'),
        });
        setShowClearConfirmation(false);
        // Reload the page to reflect the cleared state
        window.location.reload();
      } catch (error) {
        console.error('Failed to clear storage:', error);
        toast({
          type: 'error',
          description: t('settings.system.clearAllStorage.error'),
        });
      } finally {
        setIsClearing(false);
      }
    };

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">
            {t('settings.system.clearAllStorage.warning')}
          </span>
        </div>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowClearConfirmation(true)}
          disabled={isClearing}
        >
          {t('settings.system.clearAllStorage.button')}
        </Button>

        <Dialog.Dialog
          open={showClearConfirmation}
          onOpenChange={setShowClearConfirmation}
        >
          <Dialog.DialogContent className="sm:max-w-md">
            <Dialog.DialogTitle>
              {t('settings.system.clearAllStorage.confirmTitle')}
            </Dialog.DialogTitle>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {t('settings.system.clearAllStorage.confirmDescription')}
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>
                      {t('settings.system.clearAllStorage.dataTypes.chats')}
                    </li>
                    <li>
                      {t('settings.system.clearAllStorage.dataTypes.settings')}
                    </li>
                    <li>
                      {t('settings.system.clearAllStorage.dataTypes.files')}
                    </li>
                    <li>
                      {t('settings.system.clearAllStorage.dataTypes.documents')}
                    </li>
                  </ul>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowClearConfirmation(false)}
                  disabled={isClearing}
                >
                  {t('settings.system.clearAllStorage.cancel')}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleClearStorage}
                  disabled={isClearing}
                >
                  {isClearing
                    ? t('settings.system.clearAllStorage.clearing')
                    : t('settings.system.clearAllStorage.confirmButton')}
                </Button>
              </div>
            </div>
          </Dialog.DialogContent>
        </Dialog.Dialog>
      </div>
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
    {
      id: 'system',
      icon: Monitor,
      name: t('settings.sections.system.title'),
      description: t('settings.sections.system.subtitle'),
      cardItems: [
        {
          title: t('settings.system.clearAllStorage.title'),
          description: t('settings.system.clearAllStorage.description'),
          content: clearAllStorageContent(),
        },
      ],
    },
  ];

  const activeSection = settingsSections[activeSectionIndex];

  return (
    <Dialog.Dialog
      {...(open !== undefined && onOpenChange ? { open, onOpenChange } : {})}
    >
      {children && (
        <Dialog.DialogTrigger asChild>{children}</Dialog.DialogTrigger>
      )}
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
