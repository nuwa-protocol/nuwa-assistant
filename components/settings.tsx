'use client';

import React, { useState, useRef } from 'react';
import { User, Settings as SettingsIcon, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { useDIDStore } from '@/lib/stores/did-store';
import { useLocale } from '@/locales/use-locale';
import type { SettingCard } from './setting-card';
import { SettingSidebar } from './setting-sidebar';
import { SettingSection } from './setting-section';

type SettingsSection = 'profile' | 'general' | 'security';

export function Settings() {
  const { t } = useLocale();
  const [activeSection, setActiveSection] =
    useState<SettingsSection>('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { name, avatar, setName, setAvatar } = useSettingsStore();
  const { did, isAuthenticated } = useDIDStore();
  const [tempName, setTempName] = useState(name);

  const settingsNavigation = [
    {
      id: 'profile',
      name: t('settings.sections.profile.title'),
      icon: User,
    },
    {
      id: 'general',
      name: t('settings.sections.general.title'),
      icon: SettingsIcon,
    },
    {
      id: 'security',
      name: t('settings.sections.security.title'),
      icon: SettingsIcon,
    },
  ];

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

  const handleSaveName = () => {
    setName(tempName);
  };

  const renderProfileCards = (): React.ComponentProps<typeof SettingCard>[] => [
    {
      title: t('settings.profile.didInformation.title'),
      description: t('settings.profile.didInformation.description'),
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">
                {t('settings.profile.didInformation.did')}
              </Label>
              <div className="flex items-center gap-2">
                <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                  {did || t('settings.profile.didInformation.notSet')}
                </code>
                <Badge variant={isAuthenticated ? 'default' : 'secondary'}>
                  {isAuthenticated
                    ? t('settings.profile.didInformation.authenticated')
                    : t('settings.profile.didInformation.notAuthenticated')}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: t('settings.profile.photo.title'),
      description: t('settings.profile.photo.description'),
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              {avatar ? (
                <AvatarImage src={avatar} alt="Profile" />
              ) : (
                <AvatarFallback asChild>
                  <AvatarImage
                    src={`https://avatar.vercel.sh/${did}`}
                    alt="Avatar"
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
      ),
    },
    {
      title: t('settings.profile.displayName.title'),
      description: t('settings.profile.displayName.description'),
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              {t('settings.profile.displayName.name')}
            </Label>
            <div className="flex gap-2">
              <Input
                id="name"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                placeholder={t('settings.profile.displayName.placeholder')}
                className="max-w-md"
              />
              <Button
                onClick={handleSaveName}
                disabled={tempName === name}
                size="sm"
              >
                {t('settings.profile.displayName.save')}
              </Button>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const renderGeneralCards = (): React.ComponentProps<typeof SettingCard>[] => [
    {
      title: t('settings.comingSoon.title'),
      description: t('settings.comingSoon.general.description'),
      content: (
        <p className="text-sm text-muted-foreground">
          {t('settings.comingSoon.general.details')}
        </p>
      ),
    },
  ];

  const renderSecurityCards = (): React.ComponentProps<
    typeof SettingCard
  >[] => [
    {
      title: t('settings.comingSoon.title'),
      description: t('settings.comingSoon.security.description'),
      content: (
        <p className="text-sm text-muted-foreground">
          {t('settings.comingSoon.security.details')}
        </p>
      ),
    },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <SettingSection
            title={t('settings.sections.profile.title')}
            description={t('settings.sections.profile.subtitle')}
            settingCards={renderProfileCards()}
          />
        );
      case 'general':
        return (
          <SettingSection
            title={t('settings.sections.general.title')}
            description={t('settings.sections.general.subtitle')}
            settingCards={renderGeneralCards()}
          />
        );
      case 'security':
        return (
          <SettingSection
            title={t('settings.sections.security.title')}
            description={t('settings.sections.security.subtitle')}
            settingCards={renderSecurityCards()}
          />
        );
      default:
        return (
          <SettingSection
            title={t('settings.sections.profile.title')}
            description={t('settings.sections.profile.subtitle')}
            settingCards={renderProfileCards()}
          />
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <SettingSidebar
        title={t('settings.title')}
        description={t('settings.description')}
        items={settingsNavigation}
        activeSection={activeSection}
        onSectionChange={(sectionId) =>
          setActiveSection(sectionId as SettingsSection)
        }
      />
      <div className="flex-1">
        <div className="max-w-4xl mx-auto p-8">{renderContent()}</div>
      </div>
    </div>
  );
}
