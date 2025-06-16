import React from 'react';

export interface SettingCardProps {
  title: string;
  description: string;
  content: React.ReactNode;
}

export function SettingCard({ title, description, content }: SettingCardProps) {
  return (
    <div className="flex items-center gap-8 p-6 border rounded-lg bg-background shadow-sm">
      <div className="flex-1 min-w-0">
        <div className="text-base font-semibold mb-1">{title}</div>
        <div className="text-muted-foreground text-sm">{description}</div>
      </div>
      <div className="flex-shrink-0">{content}</div>
    </div>
  );
}
