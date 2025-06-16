import { cn } from '@/lib/utils';

export function SettingsNav({
  settingsSections,
  setActiveSectionIndex,
  activeSectionIndex,
}: {
  settingsSections: any[];
  setActiveSectionIndex: (index: number) => void;
  activeSectionIndex: number;
}) {
  return (
    <div className="mb-8">
      <div className="border-b border-border">
        <nav className="flex space-x-8" aria-label="Tabs">
          {settingsSections.map((section, index) => {
            const Icon = section.icon;
            const isActive = index === activeSectionIndex;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSectionIndex(index)}
                className={cn(
                  'flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
                )}
              >
                <Icon className="h-4 w-4" />
                {section.name}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
