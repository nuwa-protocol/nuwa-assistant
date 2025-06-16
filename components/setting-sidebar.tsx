import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface SettingSidebarItem {
  id: string;
  name: string;
  icon: LucideIcon;
}

interface SettingSidebarProps {
  title: string;
  description: string;
  items: SettingSidebarItem[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
}

export function SettingSidebar({
  title,
  description,
  items,
  activeSection,
  onSectionChange,
}: SettingSidebarProps) {
  return (
    <div className="w-80 border-r bg-muted/10">
      <div className="p-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <nav className="space-y-1 p-4">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSectionChange(item.id)}
            className={cn(
              'w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors',
              activeSection === item.id
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted',
            )}
          >
            <item.icon className="h-4 w-4" />
            <div className="font-medium">{item.name}</div>
          </button>
        ))}
      </nav>
    </div>
  );
}
