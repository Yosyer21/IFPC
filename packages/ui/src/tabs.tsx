'use client';

import { useState, type ReactNode } from 'react';

export interface Tab {
  value: string;
  label: string;
  content: ReactNode;
}

export interface TabsProps {
  tabs: Tab[];
  defaultValue?: string;
}

export function Tabs({ tabs, defaultValue }: TabsProps) {
  const [active, setActive] = useState(defaultValue ?? tabs[0]?.value ?? '');
  const current = tabs.find((tab) => tab.value === active);
  return (
    <div>
      <div
        role="tablist"
        aria-label="Sections"
        className="flex gap-1 overflow-x-auto border-b border-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active === tab.value}
            onClick={() => setActive(tab.value)}
            className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold transition-colors ${
              active === tab.value
                ? 'border-brand text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="pt-4">
        {current?.content}
      </div>
    </div>
  );
}
