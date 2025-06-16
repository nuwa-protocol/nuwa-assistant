import React from 'react';
import { Separator } from '@/components/ui/separator';
import { SettingCard } from './setting-card';

interface SettingSectionProps {
  title: string;
  description: string;
  settingCards: React.ComponentProps<typeof SettingCard>[];
}

export function SettingSection({
  title,
  description,
  settingCards,
}: SettingSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Separator />
      {settingCards.map((cardProps) => (
        <SettingCard key={cardProps.title} {...cardProps} />
      ))}
    </div>
  );
}
